const fs = require("fs");
const axios = require("axios");
const path = require("path");
const blessed = require("neo-blessed");
const HttpsProxyAgent = require("https-proxy-agent");

const PROXY_FILE = "./proxy.txt";
const COMMON_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7,zh-TW;q=0.6,zh;q=0.5",
};

let globalLoginData = [];

const screen = blessed.screen({
  smartCSR: true,
  title: "SOLIX-DEPIN-BOT",
  cursor: { color: "#00ff00" },
});

const container = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  style: { bg: "black", fg: "#00ff00" },
});

const statusBar = blessed.box({
  parent: container,
  top: 0,
  left: 0,
  width: "100%",
  height: 1,
  content: " [SOLIX-DEPIN-BOT v1.0.0] - SYSTEM ONLINE ",
  style: { bg: "#00ff00", fg: "black", bold: true },
});

const logWindow = blessed.log({
  parent: container,
  top: 1,
  left: 0,
  width: "70%",
  height: "90%",
  border: { type: "line", fg: "#00ff00" },
  style: { fg: "#00ff00", bg: "black", scrollbar: { bg: "#00ff00" } },
  scrollable: true,
  scrollbar: true,
  tags: true,
  padding: { left: 2, right: 2 },
});

const infoPanel = blessed.box({
  parent: container,
  top: 1,
  right: 0,
  width: "30%",
  height: "60%",
  border: { type: "line", fg: "#00ff00" },
  style: { fg: "#00ff00", bg: "black" },
  content: "{center}ACCOUNT STATUS{/center}\n\nInitializing...",
  tags: true,
  padding: { left: 1, right: 1 },
});

const transactionBox = blessed.log({
  parent: container,
  top: "61%",
  right: 0,
  width: "30%",
  height: "30%",
  border: { type: "line", fg: "#00ff00" },
  style: { fg: "#00ff00", bg: "black" },
  content: "{center}TRANSACTIONS{/center}",
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  padding: { left: 1, right: 1 },
});

const inputBox = blessed.textbox({
  parent: container,
  bottom: 0,
  left: 0,
  width: "100%",
  height: 3,
  border: { type: "line", fg: "#00ff00" },
  style: { fg: "#00ff00", bg: "black" },
  hidden: true,
  inputOnFocus: true,
});

screen.key(["escape", "q", "C-c"], () => {
  logWindow.log("Exiting application...");
  screen.render();
  clearAllIntervals(globalLoginData);
  process.exit(0);
});

function getInput(promptText) {
  return new Promise((resolve) => {
    logWindow.log(promptText);
    inputBox.setValue("");
    inputBox.show();
    screen.render();
    inputBox.once("submit", (value) => {
      inputBox.hide();
      screen.render();
      resolve(value.trim());
    });
    inputBox.focus();
    inputBox.readInput();
  });
}

console.log = (...args) => {
  const message = args.join(" ").replace(/\[0m/g, "").replace(/\[.*?m/g, "");
  logWindow.log(message);
  screen.render();
};

console.error = (...args) => {
  const message = args.join(" ").replace(/\[0m/g, "").replace(/\[.*?m/g, "");
  logWindow.log(`{red-fg}${message}{/red-fg}`);
  screen.render();
};

function showBanner() {
  logWindow.log("{bold}{blue-fg}SYSTEM BOOT INITIATED{/blue-fg}{/bold}");
  logWindow.log("{yellow-fg}SOLIX DEPIN BOT BY KAZUHA{/yellow-fg}");
  logWindow.log("{green-fg}TG: t.me/Kazuha787{/green-fg}");
  logWindow.log("{blue-fg}GH: github.com/kazuha787{/blue-fg}");
  logWindow.log("{green-fg}-------------------------{/green-fg}");
  screen.render();
}

function startFakeTransactions() {
  setInterval(() => {
    const fakePoints = (Math.random() * 0.5 + 0.01).toFixed(4);
    transactionBox.log(`{cyan-fg}+${fakePoints} pts{/cyan-fg}`);
    screen.render();
  }, 5000);
}

function createAxiosInstance(accessToken, agent) {
  const config = {
    baseURL: "https://api.solixdepin.net/api",
    headers: { ...COMMON_HEADERS },
    timeout: 120000,
  };
  if (accessToken) config.headers["authorization"] = `Bearer ${accessToken}`;
  if (agent) {
    config.proxy = false;
    config.httpAgent = agent;
    config.httpsAgent = agent;
  }
  return axios.create(config);
}

function loadAccounts() {
  const accountsPath = path.join(__dirname, "accounts.txt");
  if (!fs.existsSync(accountsPath)) {
    logWindow.log("{red-fg}accounts.txt not found. Please create it.{/red-fg}");
    screen.render();
    process.exit(1);
  }
  let data;
  try {
    data = fs.readFileSync(accountsPath, "utf8");
  } catch (err) {
    logWindow.log(`{red-fg}Error reading accounts.txt: ${err.message}{/red-fg}`);
    screen.render();
    process.exit(1);
  }
  const lines = data.split(/\r?\n/).filter((line) => line && line.includes(":"));
  const accounts = lines.map((line, index) => {
    const [email, password] = line.split(":");
    if (!email || !password) {
      logWindow.log(`{red-fg}Invalid format in accounts.txt at line ${index + 1}: ${line}{/red-fg}`);
      return null;
    }
    return { email: email.trim(), password: password.trim(), accountName: `Account ${index + 1}` };
  }).filter(Boolean);
  if (accounts.length === 0) {
    logWindow.log("{red-fg}No valid accounts found in accounts.txt{/red-fg}");
    process.exit(1);
  }
  return accounts;
}

function saveLoginData(loginData) {
  try {
    fs.writeFileSync(path.join(__dirname, "DataAccount.json"), JSON.stringify(loginData, null, 2));
  } catch (err) {
    logWindow.log(`{red-fg}Error saving DataAccount.json: ${err.message}{/red-fg}`);
    screen.render();
  }
}

function loadLoginData(allAccounts) {
  const dataPath = path.join(__dirname, "DataAccount.json");
  if (fs.existsSync(dataPath)) {
    try {
      const raw = fs.readFileSync(dataPath, "utf8");
      const data = JSON.parse(raw);
      return data.map((item) => {
        const account = allAccounts.find((acc) => acc.email === item.email);
        return { ...item, accountName: account ? account.accountName : "Unknown" };
      });
    } catch (error) {
      logWindow.log(`{red-fg}Error reading DataAccount.json: ${error.message}{/red-fg}`);
      screen.render();
      return null;
    }
  }
  return null;
}

async function login(instance, account) {
  try {
    const response = await requestWithRetry(
      () =>
        instance.post(
          "/auth/login-password",
          {
            email: account.email,
            password: account.password,
          },
          {
            headers: { "content-type": "application/json" },
          }
        ),
      `login for ${account.accountName}`
    );
    if (response.data && response.data.result === "success") {
      return response.data.data;
    } else {
      logWindow.log(`{red-fg}Login failed for ${account.accountName}: Invalid response{/red-fg}`);
      screen.render();
      return null;
    }
  } catch (error) {
    logWindow.log(`{red-fg}Login error for ${account.accountName}: ${error.message}{/red-fg}`);
    screen.render();
    return null;
  }
}

async function getConnectionQuality(instance) {
  const response = await requestWithRetry(
    () => instance.get("/point/get-connection-quality"),
    `get Connection Quality`
  );
  return response.data.data;
}

async function getProfile(instance) {
  const response = await requestWithRetry(() => instance.get("/auth/profile"), `get Profile`);
  return response.data.data;
}

async function getTotalPoint(instance) {
  const response = await requestWithRetry(() => instance.get("/point/get-total-point"), `get Total Point`);
  return response.data.data;
}

async function getUserTask(instance) {
  const response = await requestWithRetry(() => instance.get("/task/get-user-task"), `get User Task`);
  return response.data.data;
}

async function doTask(instance, taskId) {
  try {
    const response = await requestWithRetry(
      () =>
        instance.post(
          "/task/do-task",
          { taskId },
          {
            headers: { "content-type": "application/json" },
          }
        ),
      `do task ${taskId}`,
      2
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

async function claimTask(instance, taskId) {
  try {
    const response = await requestWithRetry(
      () =>
        instance.post(
          "/task/claim-task",
          { taskId },
          {
            headers: { "content-type": "application/json" },
          }
        ),
      `claim task ${taskId}`,
      2
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

async function loadProxies(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      logWindow.log("{yellow-fg}No proxy file found. Using direct connection.{/yellow-fg}");
      return [];
    }
    const data = fs.readFileSync(filePath, "utf8");
    const proxies = data.split(/\r?\n/).filter((line) => line.trim() && line.includes(":"));
    return proxies;
  } catch (error) {
    logWindow.log(`{red-fg}Error reading proxy file: ${error.message}. Using direct connection.{/red-fg}`);
    return [];
  }
}

function getRandomProxy(proxies) {
  if (!proxies || proxies.length === 0) return null;
  return proxies[Math.floor(Math.random() * proxies.length)];
}

async function createProxyAgent(proxy) {
  if (!proxy) return null;
  try {
    const [host, port, username, password] = proxy.split(":");
    const proxyUrl = username && password
      ? `http://${username}:${password}@${host}:${port}`
      : `http://${host}:${port}`;
    return new HttpsProxyAgent(proxyUrl);
  } catch (error) {
    logWindow.log(`{red-fg}Failed to create proxy agent for ${proxy}: ${error.message}{/red-fg}`);
    screen.render();
    return null;
  }
}

async function reLogin(accounts, defaultAgent) {
  const loginData = [];
  const delayMilliseconds = 1000;

  await Promise.all(
    accounts.map(async (account) => {
      logWindow.log(`Logging in ${account.accountName}...`);
      screen.render();
      const tempInstance = createAxiosInstance(null, defaultAgent);
      const data = await login(tempInstance, account);
      if (data && data.accessToken) {
        loginData.push({
          email: account.email,
          userId: data.user ? data.user._id : "unknown",
          accessToken: data.accessToken,
          accountName: account.accountName,
          totalPoints: 0,
          isEarning: false,
        });
        logWindow.log(`{green-fg}Logged in ${account.accountName}{/green-fg}`);
      } else {
        logWindow.log(`{red-fg}Login failed for ${account.accountName}{/red-fg}`);
      }
      screen.render();
      await new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
    })
  );

  saveLoginData(loginData);
  return loginData;
}

async function updateInfoPanel() {
  const content = [
    "{center}{bold}ACCOUNT STATUS{/bold}{/center}",
    "",
    ...globalLoginData.map((accountData) => {
      const status = accountData.isEarning ? "Earning" : "Not Earning";
      return `${accountData.accountName}: ${accountData.totalPoints.toFixed(4)} ({${status === "Earning" ? "green" : "red"}-fg}${status}{/})`;
    }),
  ].join("\n");
  infoPanel.setContent(content);
  screen.render();
}

async function runMiningPoints(accountData, agent, allAccounts) {
  const name = accountData.accountName;
  logWindow.log(`${name} active`);
  screen.render();
  const instance = createAxiosInstance(accountData.accessToken, agent);
  let lastInternetPoints = 0;
  let lastUpdateTime = Date.now();
  try {
    logWindow.log(`{green-fg}${name} logged in{/green-fg}`);
    screen.render();
    const profile = await getProfile(instance);
    if (!profile) {
      logWindow.log(`{red-fg}Failed to fetch profile for ${name}{/red-fg}`);
      screen.render();
      return;
    }
    accountData.isEarning = profile.isEarning;
    logWindow.log(`{green-fg}${name} earning: ${profile.isEarning}{/green-fg}`);
    screen.render();
    let totalPointData = await getTotalPoint(instance);
    if (totalPointData) {
      lastInternetPoints = totalPointData.totalPointInternet || 0;
      accountData.totalPoints = totalPointData.total || 0;
      logWindow.log(
        `{cyan-fg}${name} points: Total=${totalPointData.total.toFixed(4)}, Internet=${totalPointData.totalPointInternet.toFixed(
          4
        )}, Task=${totalPointData.totalPointTask}, Referral=${totalPointData.totalReferralPoint}{/cyan-fg}`
      );
      await updateInfoPanel();
    }
    screen.render();
    const initialCQ = await getConnectionQuality(instance);
    if (initialCQ !== null) {
      logWindow.log(`{cyan-fg}${name} connection quality: ${initialCQ}{/cyan-fg}`);
      screen.render();
    }
    const cqIntervalId = setInterval(async () => {
      try {
        const connectionQuality = await getConnectionQuality(instance);
        if (connectionQuality !== null) {
          logWindow.log(`{cyan-fg}${name} connection quality: ${connectionQuality}{/cyan-fg}`);
          totalPointData = await getTotalPoint(instance);
          if (totalPointData) {
            const currentInternetPoints = totalPointData.totalPointInternet || 0;
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastUpdateTime) / 1000 / 60;
            const earningRate = timeDiff > 0 ? (currentInternetPoints - lastInternetPoints) / timeDiff : 0;
            lastInternetPoints = currentInternetPoints;
            lastUpdateTime = currentTime;
            accountData.totalPoints = totalPointData.total || 0;
            accountData.isEarning = profile.isEarning;
            await updateInfoPanel();
          }
          screen.render();
        }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          logWindow.log(`Unauthorized for ${name}. Re-logging in...`);
          screen.render();
          clearInterval(cqIntervalId);
          clearInterval(pointIntervalId);
          const accountInfo = allAccounts.find((acc) => acc.email === accountData.email);
          const loggedInAccount = await reLogin([accountInfo], agent);
          if (loggedInAccount && loggedInAccount.length > 0) {
            accountData.accessToken = loggedInAccount[0].accessToken;
            accountData.accountName = loggedInAccount[0].accountName;
            accountData.totalPoints = loggedInAccount[0].totalPoints || 0;
            accountData.isEarning = false;
            logWindow.log(`{green-fg}Re-login successful for ${name}{/green-fg}`);
            screen.render();
            runMiningPoints(accountData, agent, allAccounts);
          } else {
            logWindow.log(`{red-fg}Re-login failed for ${name}{/red-fg}`);
            screen.render();
          }
        } else {
          logWindow.log(`{red-fg}Connection quality error for ${name}: ${error.message}{/red-fg}`);
          screen.render();
        }
      }
    }, 30000);
    const pointIntervalId = setInterval(async () => {
      try {
        totalPointData = await getTotalPoint(instance);
        if (totalPointData) {
          const currentInternetPoints = totalPointData.totalPointInternet || 0;
          const currentTime = Date.now();
          const timeDiff = (currentTime - lastUpdateTime) / 1000 / 60;
          const earningRate = timeDiff > 0 ? (currentInternetPoints - lastInternetPoints) / timeDiff : 0;
          lastInternetPoints = currentInternetPoints;
          lastUpdateTime = currentTime;
          accountData.totalPoints = totalPointData.total || 0;
          accountData.isEarning = profile.isEarning;
          logWindow.log(
            `{cyan-fg}${name} points updated: Total=${totalPointData.total.toFixed(4)}, Internet=${totalPointData.totalPointInternet.toFixed(
              4
            )}, Task=${totalPointData.totalPointTask}, Referral=${totalPointData.totalReferralPoint}{/cyan-fg}`
          );
          await updateInfoPanel();
          screen.render();
        }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          logWindow.log(`Unauthorized for ${name}. Re-logging in...`);
          screen.render();
          clearInterval(cqIntervalId);
          clearInterval(pointIntervalId);
          const accountInfo = allAccounts.find((acc) => acc.email === accountData.email);
          const loggedInAccount = await reLogin([accountInfo], agent);
          if (loggedInAccount && loggedInAccount.length > 0) {
            accountData.accessToken = loggedInAccount[0].accessToken;
            accountData.accountName = loggedInAccount[0].accountName;
            accountData.totalPoints = loggedInAccount[0].totalPoints || 0;
            accountData.isEarning = false;
            logWindow.log(`{green-fg}Re-login successful for ${name}{/green-fg}`);
            screen.render();
            runMiningPoints(accountData, agent, allAccounts);
          } else {
            logWindow.log(`{red-fg}Re-login failed for ${name}{/red-fg}`);
            screen.render();
          }
        } else {
          logWindow.log(`{red-fg}Point update error for ${name}: ${error.message}{/red-fg}`);
          screen.render();
        }
      }
    }, 600000);
    accountData.cqIntervalId = cqIntervalId;
    accountData.pointIntervalId = pointIntervalId;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logWindow.log(`Unauthorized for ${name}. Re-logging in...`);
      screen.render();
      if (accountData.cqIntervalId) clearInterval(accountData.cqIntervalId);
      if (accountData.pointIntervalId) clearInterval(accountData.pointIntervalId);
      const accountInfo = allAccounts.find((acc) => acc.email === accountData.email);
      const loggedInAccount = await reLogin([accountInfo], agent);
      if (loggedInAccount && loggedInAccount.length > 0) {
        accountData.accessToken = loggedInAccount[0].accessToken;
        accountData.accountName = loggedInAccount[0].accountName;
        accountData.totalPoints = loggedInAccount[0].totalPoints || 0;
        accountData.isEarning = false;
        logWindow.log(`{green-fg}Re-login successful for ${name}{/green-fg}`);
        screen.render();
        runMiningPoints(accountData, agent, allAccounts);
      } else {
        logWindow.log(`{red-fg}Re-login failed for ${name}{/red-fg}`);
        screen.render();
      }
    } else {
      logWindow.log(`{red-fg}Error processing ${name}: ${error.message}{/red-fg}`);
      screen.render();
    }
  }
}

async function completeTasks(accountData, agent) {
  const name = accountData.accountName;
  logWindow.log(`Tasks for ${name}...`);
  screen.render();
  const instance = createAxiosInstance(accountData.accessToken, agent);
  let tasks;
  try {
    tasks = await getUserTask(instance);
    if (!tasks || tasks.length === 0) {
      logWindow.log(`No tasks for ${name}`);
      screen.render();
      return;
    }
    logWindow.log(`Found ${tasks.length} tasks for ${name}`);
    screen.render();
  } catch (error) {
    logWindow.log(`{red-fg}Error fetching tasks for ${name}: ${error.message}{/red-fg}`);
    screen.render();
    return;
  }
  for (const task of tasks) {
    try {
      logWindow.log(`Trying task: ${task.name}`);
      screen.render();
      const result = await doTask(instance, task._id);
      if (result && result.result === "success") {
        logWindow.log(`{green-fg}Done: ${task.name}{/green-fg}`);
        try {
          const claimResult = await claimTask(instance, task._id);
          if (claimResult && claimResult.result === "success") {
            logWindow.log(`{cyan-fg}Claimed: ${task.name}{/cyan-fg}`);
            const totalPointData = await getTotalPoint(instance);
            if (totalPointData) {
              accountData.totalPoints = totalPointData.total || 0;
              await updateInfoPanel();
            }
          } else {
            logWindow.log(`Can't claim: ${task.name}`);
          }
        } catch (claimError) {
          logWindow.log(`{red-fg}Claim error for ${task.name}: ${claimError.message}{/red-fg}`);
        }
      } else {
        logWindow.log(`Skipped: ${task.name}`);
      }
      screen.render();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      logWindow.log(`{red-fg}Task error ${task.name}: ${error.message}{/red-fg}`);
      screen.render();
    }
  }
  logWindow.log(`{green-fg}Tasks done for ${name}{/green-fg}`);
  screen.render();
}

function clearAllIntervals(loginData) {
  if (!Array.isArray(loginData)) return;
  for (const accountData of loginData) {
    if (accountData.cqIntervalId) {
      clearInterval(accountData.cqIntervalId);
      logWindow.log(`Cleared connection for ${accountData.accountName}`);
      screen.render();
    }
    if (accountData.pointIntervalId) {
      clearInterval(accountData.pointIntervalId);
      logWindow.log(`Cleared points for ${accountData.accountName}`);
      screen.render();
    }
  }
}

class ProxyError extends Error {}
class UnauthorizedError extends Error {}

async function requestWithRetry(fn, description, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        throw new UnauthorizedError("Unauthorized");
      }
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function main() {
  showBanner();
  startFakeTransactions();

  const proxyList = await loadProxies(PROXY_FILE);
  logWindow.log(
    proxyList.length > 0
      ? `{green-fg}Loaded ${proxyList.length} proxies{/green-fg}`
      : `{yellow-fg}No proxies available. Using direct connection.{/yellow-fg}`
  );
  screen.render();

  const allAccounts = loadAccounts();
  logWindow.log(`{green-fg}Loaded ${allAccounts.length} accounts{/green-fg}`);
  screen.render();

  let loginData = loadLoginData(allAccounts);
  if (loginData && Array.isArray(loginData) && loginData.length > 0) {
    logWindow.log(`Found existing login data for ${loginData.length} accounts`);
    screen.render();
    if (loginData.length < allAccounts.length) {
      logWindow.log(
        `{yellow-fg}Login data missing for some accounts. Re-logging in all accounts...{/yellow-fg}`
      );
      loginData = await reLogin(allAccounts, null);
    } else {
      const answer = await getInput("Use existing tokens or re-login? (use/relogin): ");
      if (answer.toLowerCase() === "relogin") {
        loginData = await reLogin(allAccounts, null);
      }
    }
  } else {
    logWindow.log("{yellow-fg}No login data encontrados. Logging in all accounts...{/yellow-fg}");
    loginData = await reLogin(allAccounts, null);
  }

  globalLoginData = loginData;
  if (!loginData || loginData.length === 0) {
    logWindow.log("{red-fg}No valid accounts logged in. Exiting.{/red-fg}");
    screen.render();
    process.exit(1);
  }

  logWindow.log(`{green-fg}Successfully loaded ${loginData.length} accounts for processing{/green-fg}`);
  screen.render();

  logWindow.log("Menu:");
  logWindow.log("{green-fg}1. Run Mining {/green-fg}");
  logWindow.log("{green-fg}2. Run Tasks{/green-fg}");
  logWindow.log("{red-fg}3. Exit{/red-fg}");
  screen.render();

  const choice = await getInput("Choose an option (1-3): ");
  if (choice === "1") {
    logWindow.log("{green-fg}Starting mining for all accounts...{/green-fg}");
    screen.render();

    await Promise.all(
      loginData.map(async (accountData) => {
        const proxy = getRandomProxy(proxyList);
        const agent = await createProxyAgent(proxy);
        logWindow.log(
          `{cyan-fg}${accountData.accountName} using ${proxy ? `proxy ${proxy}` : "direct connection"}{/cyan-fg}`
        );
        screen.render();

        try {
          await runMiningPoints(accountData, agent, allAccounts);
        } catch (error) {
          logWindow.log(`{red-fg}Error in mining for ${accountData.accountName}: ${error.message}{/red-fg}`);
          screen.render();
        }
      })
    );

    logWindow.log("{green-fg}Mining started for all accounts. Press q to exit.{/green-fg}");
    screen.render();
  } else if (choice === "2") {
    logWindow.log("{green-fg}Starting tasks for all accounts...{/green-fg}");
    screen.render();

    await Promise.all(
      loginData.map(async (accountData) => {
        const proxy = getRandomProxy(proxyList);
        const agent = await createProxyAgent(proxy);
        logWindow.log(
          `{cyan-fg}${accountData.accountName} using ${proxy ? `proxy ${proxy}` : "direct connection"}{/cyan-fg}`
        );
        screen.render();

        try {
          await completeTasks(accountData, agent);
        } catch (error) {
          logWindow.log(`{red-fg}Error in tasks for ${accountData.accountName}: ${error.message}{/red-fg}`);
          screen.render();
        }
      })
    );

    logWindow.log("{green-fg}Tasks completed for all accounts. Back to menu...{/green-fg}");
    screen.render();
    await main();
  } else if (choice === "3") {
    logWindow.log("{red-fg}Exiting...{/red-fg}");
    screen.render();
    clearAllIntervals(globalLoginData);
    process.exit(0);
  } else {
    logWindow.log("{red-fg}Invalid choice. Exiting.{/red-fg}");
    screen.render();
    clearAllIntervals(globalLoginData);
    process.exit(1);
  }
}

main().catch((err) => {
  logWindow.log(`{red-fg}Fatal Error: ${err.message}{/red-fg}`);
  screen.render();
  clearAllIntervals(globalLoginData);
  process.exit(1);
});

process.on("SIGINT", () => {
  logWindow.log("Exiting...");
  screen.render();
  clearAllIntervals(globalLoginData);
  process.exit(0);
});

process.on("beforeExit", (code) => {
  logWindow.log(`Exiting with code ${code}...`);
  screen.render();
  clearAllIntervals(globalLoginData);
});

process.on("uncaughtException", (err) => {
  logWindow.log(`{red-fg}Uncaught error: ${err.message}{/red-fg}`);
  screen.render();
  clearAllIntervals(globalLoginData);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logWindow.log(`{red-fg}Unhandled rejection: ${reason}{/red-fg}`);
  screen.render();
  clearAllIntervals(globalLoginData);
  process.exit(1);
});
