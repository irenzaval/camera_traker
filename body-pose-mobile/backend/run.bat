
@echo off
echo Starting Body Pose Detection API...

:: Активируем виртуальное окружение (если есть)
if exist venv\ (
    call venv\Scripts\activate
)

:: Устанавливаем зависимости
pip install -r requirements.txt

:: Запускаем приложение
python app.py
pause
