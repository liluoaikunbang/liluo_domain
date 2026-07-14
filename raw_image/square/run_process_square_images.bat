@echo off
cd /d "%~dp0"
call conda activate base
python process_square_images.py
pause
