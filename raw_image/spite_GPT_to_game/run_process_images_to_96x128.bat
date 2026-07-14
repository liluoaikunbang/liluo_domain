@echo off
cd /d "%~dp0"
call conda activate base
python process_images_to_96x128.py
pause
