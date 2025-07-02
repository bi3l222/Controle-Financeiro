from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import json # Importa a biblioteca json

app = Flask(__name__)
CORS(app) # Habilita CORS para permitir requisições de qualquer origem (IMPORTANTE para CORS no frontend)

DATABASE = 'database.db' # Nome do arquivo do banco de dados SQLite

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row # Retorna linhas como dicionários (acesso por nome da coluna)
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_premium BOOLEAN DEFAULT 0,
            financial_settings TEXT DEFAULT '{}', -- Default para JSON vazio
            expenses TEXT DEFAULT '[]'             -- Default para JSON vazio
        );
    ''')
    conn.commit()
    conn.close()

# Inicializa o banco de dados quando a aplicação inicia
with app.app_context():
    init_db()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "message": "Usuário e senha são obrigatórios."}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()

    if user:
        if check_password_hash(user['password_hash'], password):
            # Carrega financial_settings e expenses do banco de dados
            financial_settings = {}
            if user['financial_settings']:
                try:
                    financial_settings = json.loads(user['financial_settings'])
                except json.JSONDecodeError:
                    financial_settings = {}

            expenses = []
            if user['expenses']:
                try:
                    expenses = json.loads(user['expenses'])
                except json.JSONDecodeError:
                    expenses = []

            return jsonify({
                "success": True,
                "message": "Login bem-sucedido!",
                "user": {
                    "username": user['username'],
                    "is_premium": bool(user['is_premium']),
                    "financialSettings": financial_settings, # Retorna as configurações
                    "expenses": expenses                     # Retorna os gastos
                }
            }), 200
        else:
            return jsonify({"success": False, "message": "Senha incorreta."}), 401
    else:
        return jsonify({"success": False, "message": "Usuário não encontrado."}), 404

@app.route('/api/register_premium_user', methods=['POST'])
def register_premium_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # IMPORTANTE: Em produção, esta rota DEVE ser protegida com autenticação de administrador!
    if not username or not password:
        return jsonify({"success": False, "message": "Nome de usuário e senha são obrigatórios."}), 400

    conn = get_db_connection()
    
    existing_user = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
    if existing_user:
        conn.close()
        return jsonify({"success": False, "message": "Nome de usuário já existe."}), 409

    password_hash = generate_password_hash(password)

    try:
        # Insere novo usuário premium com configurações e gastos vazios como JSON
        conn.execute('INSERT INTO users (username, password_hash, is_premium, financial_settings, expenses) VALUES (?, ?, ?, ?, ?)',
                     (username, password_hash, True, json.dumps({}), json.dumps([])))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Usuário premium registrado com sucesso!"}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"success": False, "message": "Erro de integridade ao registrar usuário."}), 500
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Erro inesperado: {str(e)}"}), 500

# NOVA ROTA: Salvar Configurações Financeiras de Usuário Premium
@app.route('/api/save_financial_settings', methods=['POST'])
def save_financial_settings():
    data = request.get_json()
    username = data.get('username')
    financial_settings = data.get('financialSettings') # Já vem como objeto JSON do frontend

    if not username or financial_settings is None:
        return jsonify({"success": False, "message": "Usuário e configurações financeiras são obrigatórios."}), 400
    
    # ATENÇÃO: Em um sistema real, você PRECISA verificar a autenticação do usuário aqui.
    # Ex: usar um token JWT do usuário para garantir que 'username' seja o do usuário logado.
    # Por simplicidade, assumimos que o frontend envia o username correto do usuário logado.

    conn = get_db_connection()
    try:
        # Atualiza apenas a coluna financial_settings para o usuário
        conn.execute('UPDATE users SET financial_settings = ? WHERE username = ?',
                     (json.dumps(financial_settings), username))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Configurações financeiras salvas com sucesso!"}), 200
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Erro ao salvar configurações financeiras: {str(e)}"}), 500

# NOVA ROTA: Salvar Gastos de Usuário Premium
@app.route('/api/save_expenses', methods=['POST'])
def save_expenses():
    data = request.get_json()
    username = data.get('username')
    expenses = data.get('expenses') # Já vem como array JSON do frontend

    if not username or expenses is None:
        return jsonify({"success": False, "message": "Usuário e gastos são obrigatórios."}), 400
    
    # ATENÇÃO: Assim como a rota de settings, você PRECISA verificar a autenticação do usuário aqui.

    conn = get_db_connection()
    try:
        # Atualiza apenas a coluna expenses para o usuário
        conn.execute('UPDATE users SET expenses = ? WHERE username = ?',
                     (json.dumps(expenses), username))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Gastos salvos com sucesso!"}), 200
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Erro ao salvar gastos: {str(e)}"}), 500


if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True, port=5000)