#!/usr/bin/env python3
"""
Automated DFS Pipeline Orchestrator
====================================

This script automates the complete DFS data pipeline:
1. Moves all xlsx files from various locations into raw_data/player_excel_files/
2. Runs the TypeScript loader to populate the database
3. Moves successfully processed files to attached_assets/
4. Generates comprehensive fault logs

Usage:
    python run_dfs_pipeline.py
"""

import json
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path
import logging

class DFSPipelineOrchestrator:
    def __init__(self):
        self.raw_data_dir = Path("raw_data") / "player_excel_files"
        self.archive_dir = Path("attached_assets")
        self.db_loader_script = "scripts/data-loading/load_dfs_comprehensive.ts"
        self.progress_file = Path("loader_progress.json")
        self.log_dir = Path("logs")
        
        # Setup logging
        self.setup_logging()
        
        # Create directories if they don't exist
        self.raw_data_dir.mkdir(parents=True, exist_ok=True)
        self.archive_dir.mkdir(parents=True, exist_ok=True)
        self.log_dir.mkdir(parents=True, exist_ok=True)
    
    def setup_logging(self):
        """Configure comprehensive logging"""
        # Ensure log directory exists before creating log file
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = self.log_dir / f"dfs_pipeline_{timestamp}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        self.logger.info("=" * 80)
        self.logger.info("DFS PIPELINE ORCHESTRATOR STARTED")
        self.logger.info("=" * 80)
    
    def step1_consolidate_files(self):
        """Move all xlsx files from various locations into raw_data/player_excel_files/"""
        self.logger.info("\n📁 STEP 1: Consolidating xlsx files into raw_data/player_excel_files/")
        self.logger.info("=" * 80)
        
        # Search for xlsx files recursively in SOURCE locations only
        # Exclude attached_assets (archive) and raw_data/player_excel_files (destination)
        search_paths = [
            Path("data/raw"),
            Path("data/processed"),
            Path("raw_data/player_excel_files_backup") if Path("raw_data/player_excel_files_backup").exists() else None,
        ]
        
        # Remove None values
        search_paths = [p for p in search_paths if p is not None]
        
        # Use a set to avoid duplicates
        found_files_set = set()
        
        for search_path in search_paths:
            if search_path.exists() and search_path.is_dir():
                # Find all xlsx files recursively
                xlsx_files = list(search_path.rglob("*.xlsx"))
                for f in xlsx_files:
                    # Exclude destination and archive directories
                    if (f.parent != self.raw_data_dir and 
                        not str(f).startswith(str(self.archive_dir)) and
                        "node_modules" not in str(f)):
                        found_files_set.add(f)
                
                self.logger.info(f"Found {len(xlsx_files)} files in {search_path}")
        
        found_files = list(found_files_set)
        
        if not found_files:
            self.logger.info("ℹ️  No xlsx files found to consolidate")
            return 0
        
        self.logger.info(f"Found {len(found_files)} xlsx files to consolidate")
        
        moved = 0
        errors = []
        
        for xlsx_file in found_files:
            try:
                destination = self.raw_data_dir / xlsx_file.name
                
                # Skip if file already exists in destination
                if destination.exists():
                    self.logger.debug(f"Skipping {xlsx_file.name} (already in raw_data)")
                    continue
                
                shutil.move(str(xlsx_file), str(destination))
                moved += 1
                self.logger.info(f"✓ Moved: {xlsx_file.name}")
                
            except Exception as e:
                error_msg = f"Failed to move {xlsx_file.name}: {str(e)}"
                self.logger.error(f"✗ {error_msg}")
                errors.append(error_msg)
        
        self.logger.info(f"\n✅ Consolidated {moved} files into raw_data/player_excel_files/")
        if errors:
            self.logger.warning(f"⚠️  {len(errors)} files had errors during consolidation")
        
        return moved
    
    def step2_run_loader(self):
        """Run the TypeScript database loader"""
        self.logger.info("\n📊 STEP 2: Running database loader")
        self.logger.info("=" * 80)
        
        # Check if there are files to process
        excel_files = list(self.raw_data_dir.glob("*.xlsx"))
        if not excel_files:
            self.logger.warning("⚠️  No Excel files found in raw_data/player_excel_files/")
            return False
        
        self.logger.info(f"Found {len(excel_files)} Excel files to process")
        
        try:
            # Run the TypeScript loader
            self.logger.info("Starting TypeScript loader...")
            
            result = subprocess.run(
                ["tsx", self.db_loader_script],
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )
            
            # Log the full output
            if result.stdout:
                self.logger.info("Loader output:")
                for line in result.stdout.split('\n'):
                    if line.strip():
                        self.logger.info(f"  {line}")
            
            if result.stderr:
                self.logger.error("Loader errors:")
                for line in result.stderr.split('\n'):
                    if line.strip():
                        self.logger.error(f"  {line}")
            
            if result.returncode != 0:
                self.logger.error(f"❌ Loader failed with exit code {result.returncode}")
                return False
            
            self.logger.info("✅ Database loader completed successfully")
            return True
            
        except subprocess.TimeoutExpired:
            self.logger.error("❌ Loader timed out after 10 minutes")
            return False
        except Exception as e:
            self.logger.error(f"❌ Error running loader: {str(e)}")
            return False
    
    def step3_archive_completed_files(self):
        """Move successfully processed files to attached_assets"""
        self.logger.info("\n📦 STEP 3: Archiving successfully processed files")
        self.logger.info("=" * 80)
        
        # Load progress file
        if not self.progress_file.exists():
            self.logger.error("❌ Progress file not found - cannot verify successful loads")
            self.logger.error("⚠️  Files will remain in raw_data for manual review")
            return False
        
        try:
            with open(self.progress_file, 'r') as f:
                progress_data = json.load(f)
            
            completed_files = set(progress_data.get('completed', []))
            failed_files = progress_data.get('failed', {})
            
            self.logger.info(f"Progress: {len(completed_files)} completed, {len(failed_files)} failed")
            
        except Exception as e:
            self.logger.error(f"❌ Could not load progress file: {str(e)}")
            return False
        
        # Get all files in raw_data
        excel_files = list(self.raw_data_dir.glob("*.xlsx"))
        
        moved = 0
        skipped = 0
        
        for excel_file in excel_files:
            if excel_file.name in completed_files:
                try:
                    destination = self.archive_dir / excel_file.name
                    shutil.move(str(excel_file), str(destination))
                    moved += 1
                    self.logger.info(f"✓ Archived: {excel_file.name}")
                except Exception as e:
                    self.logger.error(f"✗ Failed to archive {excel_file.name}: {str(e)}")
            else:
                status = "FAILED" if excel_file.name in failed_files else "NOT PROCESSED"
                reason = failed_files.get(excel_file.name, "Unknown") if excel_file.name in failed_files else "Not in completed list"
                self.logger.warning(f"⊘ Skipped: {excel_file.name} ({status}: {reason})")
                skipped += 1
        
        self.logger.info(f"\n✅ Archived {moved} files to attached_assets")
        if skipped > 0:
            self.logger.warning(f"⚠️  {skipped} files remain in raw_data (failed or not processed)")
        
        return True
    
    def generate_summary_report(self, consolidated, loader_success, archive_success):
        """Generate a comprehensive summary report"""
        self.logger.info("\n" + "=" * 80)
        self.logger.info("PIPELINE EXECUTION SUMMARY")
        self.logger.info("=" * 80)
        
        # Get current counts
        raw_files = len(list(self.raw_data_dir.glob("*.xlsx")))
        archive_files = len(list(self.archive_dir.glob("*.xlsx")))
        
        # Check for remaining xlsx files in source directories (indicates incomplete consolidation)
        remaining_sources = 0
        for search_path in [Path("data/raw"), Path("data/processed")]:
            if search_path.exists():
                xlsx_in_source = [
                    f for f in search_path.rglob("*.xlsx")
                    if "node_modules" not in str(f)
                ]
                remaining_sources += len(xlsx_in_source)
        
        if remaining_sources > 0:
            self.logger.warning(f"⚠️  {remaining_sources} xlsx files remain in source directories (consolidation incomplete)")
        
        # Get database counts
        try:
            result = subprocess.run(
                ["psql", "-d", "postgres", "-c", "SELECT COUNT(*) FROM dfs_players;"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                # Parse the count from psql output
                lines = result.stdout.strip().split('\n')
                if len(lines) >= 3:
                    db_count = lines[2].strip()
                    self.logger.info(f"Database: {db_count} players loaded")
        except:
            self.logger.warning("Could not retrieve database counts")
        
        self.logger.info(f"Files consolidated: {consolidated}")
        self.logger.info(f"Loader executed: {'✅ Success' if loader_success else '❌ Failed'}")
        self.logger.info(f"Archive executed: {'✅ Success' if archive_success else '❌ Failed'}")
        self.logger.info(f"Files in raw_data: {raw_files}")
        self.logger.info(f"Files in attached_assets: {archive_files}")
        
        # Load progress for detailed stats
        if self.progress_file.exists():
            try:
                with open(self.progress_file, 'r') as f:
                    progress = json.load(f)
                
                self.logger.info(f"Total processed: {progress.get('totalCompleted', 0)}")
                
                failed = progress.get('failed', {})
                if failed:
                    self.logger.warning(f"\n⚠️  Failed files ({len(failed)}):")
                    for filename, error in list(failed.items())[:10]:
                        self.logger.warning(f"  - {filename}: {error}")
                    if len(failed) > 10:
                        self.logger.warning(f"  ... and {len(failed) - 10} more")
            except:
                pass
        
        self.logger.info("=" * 80)
        self.logger.info(f"Pipeline completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        self.logger.info("=" * 80)
    
    def run(self):
        """Execute the complete pipeline"""
        try:
            # Step 1: Consolidate files
            consolidated = self.step1_consolidate_files()
            
            # Step 2: Run loader
            loader_success = self.step2_run_loader()
            
            # Step 3: Archive completed files
            archive_success = False
            if loader_success:
                archive_success = self.step3_archive_completed_files()
            else:
                self.logger.warning("⚠️  Skipping archive step due to loader failure")
            
            # Generate summary
            self.generate_summary_report(consolidated, loader_success, archive_success)
            
            # Return success status
            return loader_success and archive_success
            
        except Exception as e:
            self.logger.error(f"❌ Pipeline failed with error: {str(e)}")
            import traceback
            self.logger.error(traceback.format_exc())
            return False


def main():
    """Main entry point"""
    pipeline = DFSPipelineOrchestrator()
    success = pipeline.run()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
