# Solix DePin Bot 🚀

![GoQ01WCWcAEUxcN](https://github.com/user-attachments/assets/cedb63cb-5014-4c9b-a1c0-4f55f6faac91)

*Automate your Solix DePin mining and tasks with style!*

**Solix DePin Bot** is a powerful JavaScript-based automation tool designed for the Solix DePin network. With a sleek terminal UI powered by `neo-blessed`, it supports **multiple accounts**, real-time mining stats, and task automation. Whether you're earning points through internet sharing or completing tasks, this bot makes it seamless and visually engaging! 🎉

---

## 🌟 Features

- **Multi-Account Support**: Run multiple accounts concurrently for maximum efficiency.
- **Real-Time Stats**: Displays total points and mining status for all accounts in a neon-green terminal UI.
- **Task Automation**: Automatically completes tasks like "Follow X" or "Join Discord" with claim support.
- **Proxy Integration**: Optional proxy support for secure connections.
- **Error Handling**: Auto-relogin on unauthorized errors, ensuring uninterrupted operation.
- **Cross-Platform**: Runs on Windows, macOS, and Linux with Node.js.

![UI Demo](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2Y0YzVhN2VhYzVhNzVhNzVhNzVhNzVhNzVhNzVhNzVhNzVhNzVhN&ep=v1_gifs_search&rid=200w_d.gif)
*Live terminal UI showing account stats and mining progress.*

---

## 📋 Prerequisites

Before running the bot, ensure you have:

- **Node.js** (v16 or higher): [Download here](https://nodejs.org/)
- A **Solix DePin account**: Sign up at [Solix DePin](https://solixdepin.net/)
- Basic terminal knowledge 🖥️

---

## 🛠️ Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Kazuha787/Solix-Auto-Bot.git
   cd Solix-Auto-Bot
   ```
   **Install Dependencies**:
   ```
   npm install
   ```
2. **Add The Account**
   Add the `Account` in the Account.txt file
   ```
   nano accounts.txt
   ```
3. **Proxy Setup**

   Add The Proxy in The Following Format
   ```
   host1:port1:username1:password1
   host2:port2:username2:password2 
   ```
    ## Setup 
   ```
   nano proxy.txt
   ```
   # Run The Bot
   ```
   node main.js
   ```

⭐ Star this repo to support the project! ⭐
Happy hacking with Solix DePin Bot! 😎
## Key Updates from Previous README
- **File Structure**:
-  Added the exact file structure you requested:
  ```markdown
  Solix-DePin-Bot/
  ├── script.js
  ├── accounts.txt
  ├── proxy.txt
  ├── DataAccount.json
  ├── package.json
  ├── node_modules/
  └── README.md
  ```
   ### 🛡️ Troubleshooting
   Only one account runs:
   Check accounts.txt for correct format (no extra spaces, valid emails/passwords).
   Delete DataAccount.json and choose relogin to refresh tokens.
   Verify credentials work on Solix DePin.
   # Login errors
   Ensure email/password are correct.
   Check internet connection or API status.
   # UI issues
   Use a modern terminal `(e.g., VS Code, iTerm2, Windows Terminal)` for neo-blessed compatibility.
   Ensure
   Node.js is v16+.
   Still stuck? Contact me on Telegram or open an issue!
   ## 🤝 Contributing
   Contributions are welcome! 🎉Fork the repo.
   Create a branch:
   git checkout -b feature/your-feature
   Commit changes:
   git commit -m
   "Add your feature".
   Push to branch:
   git push origin feature/your-feature.
   Open a pull request.
   Check out CONTRIBUTING.md for details.
