## 🛠️ Getting Started

Welcome to SakVerse! Follow this guide to set up the project on your system quickly and efficiently.

---

### Prerequisites
Before starting, ensure your system meets the following requirements:

- [Node.js](https://nodejs.org/) (v16.0.0 or higher)
- [Git](https://git-scm.com/)

---

## 📋 Installation

### Step 1: Clone or Download the Repository
You can either clone the repository using Git or download it as a ZIP file:

#### Clone the Repository
```bash
# Clone the repository
git clone https://github.com/mohitsaxena27/SakVerse.git
```

#### Download as ZIP
Alternatively, download the repository as a [ZIP file](https://github.com/mohitsaxena27/SakVerse.git) and extract its contents to your desired location.

---

### Step 2: Set Up the Backend
1. **Navigate to the Backend Directory:**
   ```bash
   cd SakVerse/backend
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Backend Server:**
   ```bash
   node proxy
   ```

4. **Verify the Backend Server is Running:**
   Once the server is running, you should see this message in your terminal:
   ```
   Proxy server running at http://localhost:3000
   ```

---

### Step 3: Set Up the Frontend
1. **Navigate to the Frontend Directory:**
   ```bash
   cd ../work-main
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Resolve Potential Axios Issues (Optional):**
   If you encounter errors related to Axios, update the `react-axios` package to version `^2.0.6` by running:
   ```bash
   npm install react-axios@^2.0.6
   ```

4. **Start the Frontend Development Server:**
   ```bash
   npm run dev
   ```


---

### Need Assistance?
If you encounter any issues or need further help, feel free to reach out to the repository collaborators.

---

### 🎉 You're All Set!
With both the backend and frontend servers running, you can now explore and interact with SakVerse. Happy coding!

