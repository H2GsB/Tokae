#!/bin/bash

# --- Variáveis de Configuração ---
FLASK_DIR="/home/ubuntu/music-request-api"
REACT_DIR="/home/ubuntu/music-request-app"
VENV_DIR="$FLASK_DIR/venv"
STATIC_DIR="$FLASK_DIR/src/static"

echo "--- Iniciando Script de Deploy para Live Request ---"

# 1. Configurar o Backend (Flask)
echo "Configurando o Backend (Flask)..."
cd $FLASK_DIR

# Criar e ativar ambiente virtual (se não existir)
if [ ! -d "$VENV_DIR" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv $VENV_DIR
fi

source $VENV_DIR/bin/activate

# Instalar dependências Python
echo "Instalando dependências Python..."
pip install -r requirements.txt

# 2. Configurar o Frontend (React)
echo "Configurando o Frontend (React)..."
cd $REACT_DIR

# Instalar dependências Node.js/pnpm
echo "Instalando dependências Node.js/pnpm..."
pnpm install

# Compilar o Frontend
echo "Compilando o Frontend React..."
pnpm run build --outDir $STATIC_DIR

# 3. Preparar o Banco de Dados
echo "Preparando o Banco de Dados (SQLite)..."
# O main.py já cria e faz o seed inicial se o banco estiver vazio
python $FLASK_DIR/src/main.py

# 4. Finalização
echo "--- Deploy Concluído ---"
echo "O aplicativo está pronto para ser servido."
echo "Para iniciar o servidor de produção (ex: Gunicorn), use:"
echo "gunicorn --bind 0.0.0.0:5000 'src.main:app'"
echo "Lembre-se de configurar um servidor web (Nginx) como proxy reverso."

# Desativar ambiente virtual
deactivate

