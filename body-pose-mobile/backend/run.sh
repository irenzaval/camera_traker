
#!/bin/bash

echo "Starting Body Pose Detection API..."

# Активируем виртуальное окружение (если есть)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Устанавливаем зависимости
pip install -r requirements.txt

# Запускаем приложение
python app.py
