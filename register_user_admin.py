import requests
import json

# URL DO SEU BACKEND PYTHON (MUITO IMPORTANTE: SUBSTITUA PELA URL REAL!)
# Ex: 'http://127.0.0.1:5000/api' se testando localmente
# ou 'https://seuhosting.com/api' se já estiver na hospedagem
BACKEND_API_URL = 'http://127.0.0.1:5000/api' 

def register_user(username, password):
    url = f"{BACKEND_API_URL}/register_premium_user"
    headers = {'Content-Type': 'application/json'}
    data = {
        "username": biel123,
        "password": 12345
        # O status is_premium é definido como True no app.py para esta rota
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status() # Lança um erro para status de erro HTTP
        print(f"Resposta do servidor: {response.json()}")
    except requests.exceptions.HTTPError as http_err:
        print(f"Erro HTTP: {http_err}")
        print(f"Resposta de erro: {response.json()}")
    except requests.exceptions.ConnectionError as conn_err:
        print(f"Erro de conexão: {conn_err}. Certifique-se de que o backend está rodando.")
    except requests.exceptions.Timeout as timeout_err:
        print(f"Erro de timeout: {timeout_err}")
    except requests.exceptions.RequestException as req_err:
        print(f"Ocorreu um erro na requisição: {req_err}")

if __name__ == "__main__":
    print("--- Ferramenta de Registro de Usuário Premium (ADMIN) ---")
    user = input("Digite o NOME DE USUÁRIO para o novo usuário premium: ")
    pw = input("Digite a SENHA para o novo usuário premium: ")

    register_user(user, pw)
    print("\nVerifique o console do seu backend ou seu banco de dados para confirmar o registro.")