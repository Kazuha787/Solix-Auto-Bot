"use strict";

/**
########################################################
#                                                      #
#   CODE  : SOLIX DEPIN Bot v1.0.0                     #
#   NodeJs: v23.10.0                                   #
#   Author: CMALF                                      #
#   TG    : https://t.me/djagocuan                     #
#   GH    : https://github.com/cmalf                   #
#                                                      #
########################################################
*/
/**
 * This code is open-source and welcomes contributions! 
 * 
 * If you'd like to add features or improve this code, please follow these steps:
 * 1. Fork this repository to your own GitHub account.
 * 2. Make your changes in your forked repository.
 * 3. Submit a pull request to the original repository. 
 * 
 * This allows me to review your contributions and ensure the codebase maintains high quality. 
 * 
 * Let's work together to improve this project!
 * 
 * P.S. Remember to always respect the original author's work and avoid plagiarism. 
 * Let's build a community of ethical and collaborative developers.
 */


const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

// Color definitions
const Colors = {
  Green: "\x1b[32m",
  Red: "\x1b[31m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Purple: "\x1b[35m",
  Yellow: "\x1b[33m",
  Magenta: "\x1b[95m",
  Cyan: "\x1b[36m",
  Magenta2: "\x1b[91m",
  Blue: "\x1b[34m",
  Rainbow: "\x1b[38;5;206m",
  Gold: "\x1b[38;5;220m",
  Teal: "\x1b[38;5;51m",
  Orange: "\x1b[38;5;208m",
  Neon: "\x1b[38;5;198m",
  Electric: "\x1b[38;5;123m",
  RESET: "\x1b[0m"
};

function CoderMark() {
  try {
    console.log(`
    
 ______     __    __     ______     __         ______  
/\\  ___\\   /\\ "-./  \\   /\\  __ \\   /\\ \\       /\\  ___\\ ${Colors.Green}
\\ \\ \\____  \\ \\ \\-./\\ \\  \\ \\  __ \\  \\ \\ \\____  \\ \\  __\\ 
 \\ \\_____\\  \\ \\_\\ \\ \\_\\  \\ \\_\\ \\_\\  \\ \\_____\\  \\ \\_\\ ${Colors.Blue}  
  \\/_____/   \\/_/  \\/_/   \\/_/\\/_/   \\/_____/   \\/_/   ${Colors.Blue}${Colors.RESET}
                                                        
  
${Colors.Gold}[+] ${Colors.RESET}SOLIX BOT ${Colors.Green}JS ${Colors.RESET} 
  
${Colors.Green}${"―".repeat(55)}
  
${Colors.Gold}[+]${Colors.RESET} DM : ${Colors.Teal}https://t.me/Djagocuan
  
${Colors.Gold}[+]${Colors.RESET} GH : ${Colors.Teal}https://github.com/cmalf/
    
${Colors.Green}${"―".repeat(55)}${Colors.RESET}
    `);
  } catch (error) {
    console.error("An error occurred while logging the banner:", error);
  }
}

class ProxyError extends Error {
  constructor(message, proxy) {
    super(message);
    this.name = "ProxyError";
    this.proxy = proxy;
  }
}

class UnauthorizedError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = statusCode;
  }
}

async function requestWithRetry(requestFn, description) {
  while (true) {
    try {
      const response = await requestFn();
      return response;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error(
          Colors.Red +
          `Error in ${description}: `+ Colors.Red +`HTTP 401 - Unauthorized. Triggering re-login.` +
          Colors.RESET
        );
        throw new UnauthorizedError(`Unauthorized: ${description}`, 401);
      } else if (error.response && error.response.status) {
        console.error(
          Colors.Red +
          `Error in ${description}: `+ Colors.Red +` HTTP ${error.response.status} - ${error.response.statusText}. ` + Colors.Gold + `Retrying in 5 seconds...` +
          Colors.RESET
        );
      } else {
        console.error(
          Colors.Red +
          `Error in ${description}: ` + Colors.Red +`${error.message}.` + Colors.Gold +`Retrying in 15 seconds...` +
          Colors.RESET
        );
      }
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
}

function loadProxies(PROXY_FILE) {
  try {
    return fs
      .readFileSync(PROXY_FILE, "utf8")
      .split("\n")
      .map(line => line.trim())
      .filter(line => line && line.length > 0);
  } catch (err) {
    console.error(Colors.Red + "Error loading proxies: " + err.message + Colors.RESET);
    return [];
  }
}

function getRandomProxy(proxyList) {
  return proxyList.length ? proxyList[Math.floor(Math.random() * proxyList.length)] : null;
}

async function createProxyAgent(proxyUrl) {
  if (!proxyUrl) throw new ProxyError("Proxy URL is required", proxyUrl);
  try {
    if (proxyUrl.startsWith("http://") || proxyUrl.startsWith("https://"))
      return new HttpsProxyAgent(proxyUrl);
    if (proxyUrl.startsWith("socks://") || proxyUrl.startsWith("socks5://"))
      return new SocksProxyAgent(proxyUrl);
    throw new ProxyError(`Unsupported proxy protocol: ${proxyUrl}`, proxyUrl);
  } catch (err) {
    if (err instanceof ProxyError) throw err;
    throw new ProxyError(`Failed to create proxy agent: ${err.message}`, proxyUrl);
  }
}

const maskEmail = (email) => {
  if (typeof email !== 'string') {
    throw new Error('Invalid input: email must be a string');
  }

  const [username, domain] = email.split('@');

  if (!username || !domain) {
    throw new Error('Invalid email format');
  }

  if (username.length < 4) {
    return email;
  }
  const maskedUsername = username.slice(0, 2) + ':::' + username.slice(-2);
  return `${maskedUsername}@${domain}`;
};

// Module exports
module.exports = {
  Colors,
  CoderMark,
  ProxyError,
  requestWithRetry,
  loadProxies,
  getRandomProxy,
  createProxyAgent,
  maskEmail,
  UnauthorizedError
};