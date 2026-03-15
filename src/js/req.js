const fs = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app, BrowserWindow, Menu, ipcMain, desktopCapturer, remote, clipboard  } = require('electron');
const psList = require('ps-list').default;