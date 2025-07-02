import sqlite3
from werkzeug.security import generate_password_hash
import json

DATABASE = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def create_test_premium_user(username, password):
    conn = get_db_connection()
    
    existing_user = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
    if existing_user:
        print(f"Usuário '{username}' já existe no banco de dados. Pulando a criação.")
        conn.close()
        return

    password_hash = generate_password_hash(password)
    
    default_financial_settings = {}
    default_expenses = []

    try:
        conn.execute(
            'INSERT INTO users (username, password_hash, is_premium, financial_settings, expenses) VALUES (?, ?, ?, ?, ?)',
            (username, password_hash, True, json.dumps(default_financial_settings), json.dumps(default_expenses))
        )
        conn.commit()
        print(f"Usuário Premium '{username}' criado com sucesso no banco de dados!")
        print(f"Senha (hash): {password_hash}")
    except sqlite3.IntegrityError:
        print(f"Erro: Usuário '{username}' já existe (apesar da verificação inicial, erro de integridade).")
    except Exception as e:
        print(f"Erro inesperado ao criar usuário: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    print("--- Criando Usuário de Teste Premium ---")
    
    test_username = "Pedro123"
    test_password = "Pedro123"
    
    create_test_premium_user(test_username, test_password)
    
    print("\nLembre-se de INICIAR SEU BACKEND (app.py) novamente.")
    print("Você pode agora tentar logar no seu site com o usuário e senha acima.")