import UIKit

class NativeLoginViewController: UIViewController {
    var onLogin: ((String, String) -> Void)?

    private let usernameField: UITextField = {
        let field = UITextField()
        field.placeholder = "Username"
        field.borderStyle = .roundedRect
        field.autocapitalizationType = .none
        field.translatesAutoresizingMaskIntoConstraints = false
        return field
    }()

    private let passwordField: UITextField = {
        let field = UITextField()
        field.placeholder = "Password"
        field.borderStyle = .roundedRect
        field.isSecureTextEntry = true
        field.translatesAutoresizingMaskIntoConstraints = false
        return field
    }()

    private let loginButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Login", for: .normal)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        view.addSubview(usernameField)
        view.addSubview(passwordField)
        view.addSubview(loginButton)
        setupConstraints()
        loginButton.addTarget(self, action: #selector(loginTapped), for: .touchUpInside)
    }

    private func setupConstraints() {
        NSLayoutConstraint.activate([
            usernameField.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            usernameField.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -40),
            usernameField.widthAnchor.constraint(equalToConstant: 250),
            passwordField.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            passwordField.topAnchor.constraint(equalTo: usernameField.bottomAnchor, constant: 16),
            passwordField.widthAnchor.constraint(equalTo: usernameField.widthAnchor),
            loginButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            loginButton.topAnchor.constraint(equalTo: passwordField.bottomAnchor, constant: 24)
        ])
    }

    @objc private func loginTapped() {
        guard let username = usernameField.text, let password = passwordField.text else { return }
        onLogin?(username, password)
    }
}
