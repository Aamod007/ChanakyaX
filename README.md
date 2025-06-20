# ChanakyaX

ChanakyaX is a Discord bot that allows users to interact with a local Large Language Model (LLM) backend (default: `deepseek-r1:7b`) via slash commands. ChanakyaX manages a queue for prompt processing and creates threads for each user prompt, streaming responses in real time.

---

## 🚀 Features
- Slash command `/prompt` to send prompts to the LLM
- Queue system to manage multiple user requests
- Automatic thread creation for each prompt
- Real-time streaming of LLM responses
- Built with [discord.js](https://discord.js.org/) and TypeScript

---

## 🖥️ 1. Install and Run Ollama (LLM Backend)

ChanakyaX requires a local LLM backend. We recommend [Ollama](https://ollama.com/download/windows) for Windows.

### **Step 1: Download and Install Ollama**
- Go to the [Ollama Windows Download Page](https://ollama.com/download/windows)
- Download the Windows installer (`.exe` file)
- Run the installer and follow the prompts

### **Step 2: Run Ollama and Download a Model**
Open Command Prompt or PowerShell and run:
```sh
ollama run llama2
```
- This will download and start the Llama 2 model. You can also use other models (see [Ollama Models](https://ollama.com/library)).
- Keep this terminal open and running while you use ChanakyaX.

> **Note:** ChanakyaX expects Ollama's API to be available at `http://localhost:11434/api/generate`.

---

## 🤖 2. Create a Discord Bot (Discord Developer Portal)

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and give it a name (e.g., ChanakyaX)
3. Go to **Bot** in the sidebar, then click **Add Bot**
4. Under **Token**, click **Reset Token** and copy your **Bot Token**
5. Go to **OAuth2 > General** and copy your **Client ID**
6. Under **OAuth2 > URL Generator**, select `bot` and `applications.commands` scopes, and set permissions (e.g., `Send Messages`, `Create Public Threads`)
7. Copy the generated URL, open it in your browser, and invite ChanakyaX to your server

---

## ⚙️ 3. Configure Environment Variables

Create a `.env` file in the root directory of this project:
```env
DISCORD_LLM_BOT_TOKEN=your-discord-bot-token-here
DISCORD_LLM_BOT_CLIENT_ID=your-discord-client-id-here
```
Replace the values with your actual **Bot Token** and **Client ID** from the Discord Developer Portal.

---

## 🛠️ 4. Install and Build ChanakyaX

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd discord-bot-llm
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Build the project:**
   ```sh
   npx tsc
   ```

---

## ▶️ 5. Run ChanakyaX

1. **Start your LLM backend** (Ollama) as described above
2. **Start ChanakyaX:**
   ```sh
   node dist/bot.js
   ```
   Or, for development with TypeScript:
   ```sh
   npx ts-node src/bot.ts
   ```
3. **ChanakyaX will deploy slash commands automatically on startup**
4. **Use the `/prompt` command** in your Discord server:
   - `/prompt input: <your message>`
   - ChanakyaX will create a thread and stream the LLM's response there

---

## 🧩 How It Works
- ChanakyaX listens for the `/prompt` command
- User prompts are queued and processed in order (up to 3 concurrently)
- For each prompt, a new thread is created in the channel
- The bot sends the prompt to the LLM backend and streams the response in real time, updating the thread message(s)
- The queue system ensures fair processing and rate limit compliance

---

## 🛠️ Customization
- **LLM Model:** The default model is set to `deepseek-r1:7b` in `src/queue/queue.ts`. You can change this as needed
- **LLM Backend URL:** The backend URL is hardcoded as `http://localhost:11434/api/generate` in `src/queue/queue.ts`. Update this if your backend runs elsewhere

---

## 👩‍💻 Development
- TypeScript source is in `src/`, compiled output in `dist/`
- Add new commands in `src/commands/` following the structure of the `prompt` command
- Type definitions for custom Discord.js extensions are in `src/types/discord.d.ts`

---

## 📄 License
ISC

---

*This project is not affiliated with Discord or any LLM provider. Use responsibly and ensure compliance with Discord's terms of service.* 
