from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app) # Habilita CORS para permitir requisições do seu frontend (domínios diferentes)

DATABASE = 'database.db' # Nome do arquivo do banco de dados SQLite

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row # Retorna linhas como dicionários (acesso por nome da coluna)
    return conn

def init_db():
    conn = get_db_connection()
    # Cria a tabela 'users' se ela não existir
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_premium BOOLEAN DEFAULT 0, -- 0 para False, 1 para True
            financial_settings TEXT,     -- Armazenar configurações financeiras como JSON string
            expenses TEXT                -- Armazenar gastos como JSON string
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
            # Retorna o status premium e dados financeiros/gastos
            financial_settings = {}
            if user['financial_settings']:
                try:
                    financial_settings = json.loads(user['financial_settings'])
                except json.JSONDecodeError:
                    financial_settings = {} # Em caso de erro de parse, retorna vazio

            expenses = []
            if user['expenses']:
                try:
                    expenses = json.loads(user['expenses'])
                except json.JSONDecodeError:
                    expenses = [] # Em caso de erro de parse, retorna vazio

            return jsonify({
                "success": True,
                "message": "Login bem-sucedido!",
                "user": {
                    "username": user['username'],
                    "is_premium": bool(user['is_premium']),
                    "financialSettings": financial_settings,
                    "expenses": expenses
                }
            }), 200
        else:
            return jsonify({"success": False, "message": "Senha incorreta."}), 401
    else:
        return jsonify({"success": False, "message": "Usuário não encontrado."}), 404

# Rota para o ADMIN cadastrar usuários premium (DEVE SER PROTEGIDA!)
# Em um ambiente real, esta rota NÃO DEVERIA ESTAR ACESSÍVEL PUBLICAMENTE
# ou deveria exigir autenticação admin forte (ex: token secreto).
# Aqui é apenas para você poder testar o cadastro.
import json # Importa json para manipular strings JSON
@app.route('/api/register_premium_user', methods=['POST'])
def register_premium_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # OPCIONAL: adicionar uma chave secreta para validar que só você pode usar esta rota
    # admin_secret_key = data.get('admin_secret_key')
    # if admin_secret_key != "SUA_CHAVE_SECRETA_ADMIN": # Defina esta chave
    #    return jsonify({"success": False, "message": "Acesso negado."}), 403

    if not username or not password:
        return jsonify({"success": False, "message": "Nome de usuário e senha são obrigatórios."}), 400

    conn = get_db_connection()
    
    # Verifica se o usuário já existe
    existing_user = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
    if existing_user:
        conn.close()
        return jsonify({"success": False, "message": "Nome de usuário já existe."}), 409 # Conflict

    password_hash = generate_password_hash(password) # Cria o hash da senha

    try:
        conn.execute('INSERT INTO users (username, password_hash, is_premium, financial_settings, expenses) VALUES (?, ?, ?, ?, ?)',
                     (username, password_hash, True, json.dumps({}), json.dumps([]))) # Inicia com settings/expenses vazios
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Usuário premium registrado com sucesso!"}), 201 # Created
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"success": False, "message": "Erro de integridade ao registrar usuário."}), 500
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Erro inesperado: {str(e)}"}), 500

# Rota para o ADMIN atualizar dados de um usuário (financeiro, gastos)
# Esta rota também DEVE SER PROTEGIDA com autenticação de admin.
@app.route('/api/update_user_data', methods=['POST'])
def update_user_data():
    data = request.get_json()
    username = data.get('username')
    financial_settings = data.get('financialSettings', {})
    expenses = data.get('expenses', [])

    # Autenticação de admin necessária aqui (ex: token secreto, IP restrito)
    # if data.get('admin_secret_key') != "SUA_CHAVE_SECRETA_ADMIN":
    #     return jsonify({"success": False, "message": "Acesso negado."}), 403

    if not username:
        return jsonify({"success": False, "message": "Nome de usuário é obrigatório."}), 400

    conn = get_db_connection()
    try:
        conn.execute('UPDATE users SET financial_settings = ?, expenses = ? WHERE username = ?',
                     (json.dumps(financial_settings), json.dumps(expenses), username))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Dados do usuário atualizados com sucesso!"}), 200
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Erro ao atualizar dados: {str(e)}"}), 500


if __name__ == '__main__':
    # Quando rodar localmente, esta linha inicializa o DB
    # Em um ambiente de hospedagem, o provedor pode ter um script para iniciar o DB
    with app.app_context():
        init_db() 
    app.run(debug=True, port=5000) # Rode em debug=True para desenvolvimento. Mude para False em produção!

    # Seu app.py (fragmento, certifique-se de ter o código completo)

# ... (imports e configurações de DB) ...

@app.route('/api/register_premium_user', methods=['POST'])
def register_premium_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # IMPORTANTE: Em produção, esta rota DEVE ser protegida!
    # Por exemplo, com um token de autenticação de administrador.
    # Exemplo:
    # admin_token = request.headers.get('Authorization')
    # if admin_token != "Bearer SEU_TOKEN_SECRETO_ADMIN":
    #    return jsonify({"success": False, "message": "Acesso negado."}), 403

    if not username or not password:
        return jsonify({"success": False, "message": "Nome de usuário e senha são obrigatórios."}), 400

    conn = get_db_connection()
    
    existing_user = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
    if existing_user:
        conn.close()
        return jsonify({"success": False, "message": "Nome de usuário já existe."}), 409

    password_hash = generate_password_hash(password)

    try:
        # AQUI definimos is_premium como True (1)
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

# ... (outras rotas e execução do app) ...