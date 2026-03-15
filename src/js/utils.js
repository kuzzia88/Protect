async function addToThePageAccount(id, web_name, web_url, login, password, comment) {
    const container = document.getElementById('container');
    const accountDiv = document.createElement('div');
    accountDiv.className = 'account-div';
    accountDiv.id = id;

    const websiteName = document.createElement('label');
    websiteName.onclick = () => Copy(web_name);
    websiteName.className = 'website-name';
    websiteName.id = web_name;
    websiteName.textContent = web_name;
    accountDiv.appendChild(websiteName);

    const whiteLine = document.createElement('canvas');
    whiteLine.className = 'white-line';
    accountDiv.appendChild(whiteLine);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';

    const websiteUrl = document.createElement('label');

    websiteUrl.className = 'website-url';
    websiteUrl.onclick = () => Copy(web_url);
    websiteUrl.id = web_url;
    websiteUrl.textContent = web_url;
    contentDiv.appendChild(websiteUrl);

    const loginDiv = document.createElement('div');
    loginDiv.className = 'login-div';

    const loginLabel = document.createElement('label');
    loginLabel.className = 'login';
    loginLabel.onclick = () => Copy(login);
    loginLabel.id = login;
    loginLabel.textContent = login;

    loginDiv.appendChild(loginLabel);
    contentDiv.appendChild(loginDiv);

    const passwordDiv = document.createElement('div');
    passwordDiv.className = 'password-div';

    const passwordLabel = document.createElement('label');
    passwordLabel.className = 'password';
    passwordLabel.onclick = () => Copy(password);
    passwordLabel.id = password;
    passwordLabel.textContent = password;

    passwordDiv.appendChild(passwordLabel);
    contentDiv.appendChild(passwordDiv);

    const commentLabel = document.createElement('label');
    commentLabel.className = 'comment';
    commentLabel.id = comment;
    commentLabel.onclick = () => Copy(comment);
    commentLabel.textContent = comment;
    contentDiv.appendChild(commentLabel);

    const whiteLineBot = document.createElement('canvas');
    whiteLineBot.className = 'white-line-bot';
    contentDiv.appendChild(whiteLineBot);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.id = `${id}Delete`
    deleteBtn.onclick = () => deleteAccount(id);
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    contentDiv.appendChild(deleteBtn);

    accountDiv.appendChild(contentDiv);

    container.appendChild(accountDiv);
}


async function deleteAccount(id) {
    try {
        const data = JSON.parse(await fs.readFile('accounts.json', 'utf-8'));
        
        const updatedAccounts = {
        accounts: data.accounts.filter(account => account.id !== id)
        };
        
        await fs.writeFile('accounts.json', JSON.stringify(updatedAccounts, null, 2));
        
        const account = document.getElementById(id);
        account.remove();

        showmsg('Success!', `Account with ID ${id} successfully deleted!`);
        return true;
    } catch (error) {
        showmsg('Error', err, 'error');
        return false;
    }
}

async function addAccount(id, web_name, web_url, login, password, comment) {
    const elements = document.getElementsByClassName('account-div');
    let accountExists = false;

    for (let element of elements) {
        if (element.id === id) {
        accountExists = true;
        break;
        }
    }

    if (!accountExists) {
        await addToThePageAccount(id, web_name, web_url, login, password, comment);
    }
}

async function readJson(JSONname) {
    try {
        const data = await fs.readFile(JSONname, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData;
    } catch (err) {
        showmsg('Error', err, 'error');
    }
}

async function loadContentFromJson(content, password) {
    try {
        const data = await readJson(content);
        
        if (!data?.accounts || !Array.isArray(data.accounts)) {
            showmsg('Error', 'Нет данных об аккаунтах или некорректная структура файла', 'error');
            return;
        }

        for (const account of data.accounts) {
            if (!account.id || !account.web_name || !account.login) {
            console.warn('Аккаунт с неполными данными:', account);
            continue;
            }

            addAccount(account.id, await decryptText(account.web_name, password), await decryptText(account.web_url, password) || '', await decryptText(account.login, password), await decryptText(account.password, password) || '', await decryptText(account.comment, password) || '');
        }
    } catch (err) {
        showmsg('Error', err, 'error');
    }
    
}

async function readDb(dbname) {
    return new Promise((resolve, reject) => {
        let db = new sqlite3.Database(dbname);
        
        db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS accounts (
            id TEXT,
            web_name TEXT,
            web_url TEXT,
            login TEXT,
            password TEXT,
            comment TEXT,
            UNIQUE(id)
        )`, (err) => {
            if (err) return reject(err);
            
            db.all("SELECT * FROM accounts", [], (err, rows) => {
            db.close();
            if (err) return reject(err);
            resolve(rows);
            });
        });
        });
    });
}

async function loadContentFromDb(content, password) {
    const rows = await readDb(content);
    for (const account of rows) {
        addAccount(account.id, await decryptText(account.web_name, password), await decryptText(account.web_url, password) || '', await decryptText(account.login, password), await decryptText(account.password, password) || '', await decryptText(account.comment, password) || '');
    }
}

function copyText(element) {
    const text = document.getElementById(element).textContent;
    navigator.clipboard.writeText(text)
        .then(() => alert("Текст скопирован!"))
        .catch(err => alert("Ошибка: " + err));
}

async function updateDbData(content, jsonData) {
    return new Promise((resolve, reject) => {
        let db = new sqlite3.Database(content);
        
        db.serialize(async () => {
        try {
            await new Promise((resolveDelete, rejectDelete) => {
            db.run(`DELETE FROM accounts`, function(err) {
                if (err) return rejectDelete(err);
                resolveDelete();
            });
            });

            for (const account of jsonData.accounts) {
            await new Promise((resolveInsert, rejectInsert) => {
                db.run(
                `INSERT INTO accounts (id, web_name, web_url, login, password, comment) VALUES (?, ?, ?, ?, ?, ?)`, 
                [account.id, account.web_name, account.web_url, account.login, account.password, account.comment], 
                function(err) {
                    if (err) return rejectInsert(err);
                    resolveInsert();
                }
                );
            });
            }

            db.all("SELECT * FROM accounts", [], (err, rows) => {
            db.close();
            if (err) return reject(err);
            resolve(rows);
            });
        } catch (err) {
            db.close();
            reject(err);
        }
        });
    });
}

async function updateFromJson(name) {
    const jsonData = await readJson(`${name}.json`);
    const dbData = await readDb(`${name}.db`);

    if (jsonData.accounts.length !== dbData.length) {
        await updateDbData(`${name}.db`, jsonData);
        await updateFromJson(name);
    } else {
        for (let i = 0; i < jsonData.accounts.length; i++) {
        const dbAccount = dbData[i];
        const jsonAccount = jsonData.accounts[i];

        if (jsonAccount.id !== dbAccount.id || jsonAccount.web_name !== dbAccount.web_name || jsonAccount.web_url !== dbAccount.web_url || jsonAccount.login !== dbAccount.login || jsonAccount.password !== dbAccount.password || jsonAccount.comment !== dbAccount.comment) {
            console.warn("[WARN] Data from database don't matches with json");
        }
        }
    }   
}

async function loadContent(content, local, password) {
    if (local) {await loadContentFromJson(`${content}.json`, password); await updateFromJson(content);} else {await updateFromServer();await GetInfoFromServer()}
    await loadContentFromDb(`${content}.db`, password);
}

async function start() {
    try {
        const setupModal = document.getElementById('setupModal');
        const saveMasterPassword = document.getElementById('master-password-check');
        const fontColor = localStorage.getItem('font-color');

        setupModal.style.display = localStorage.getItem('firstTime') ? 'none' : 'flex';
        saveMasterPassword.style.display = localStorage.getItem('firstTime') ? 'flex' : 'none';
        
        localStorage.setItem('isShowBtnPressed', 'false');

        await fs.access('accounts.json');

        const background =  await readConfig('background');

        if (background !== 'default') {
            try {
                const body = document.querySelector('.root');
                body.style.backgroundImage = `url('${background}')`;
                showmsg('Success!', 'Background successfully changed!');

            } catch (err) {
                showmsg('Error', err, 'error');
            }
        }

        if (fontColor !== '#fff') {
            document.documentElement.style.setProperty('--font-color', fontColor);
        }
    } catch {
        const initialData = {
            accounts: []
        };

        await fs.writeFile('accounts.json', JSON.stringify(initialData, null, 2), 'utf8');
        await start();
    }
}

async function createAccount(id, webName, webUrl, login, password, comment, masterpassword) {
    try {
        const data = await readJson('accounts.json');

        const account = {
            "id": id,
            "web_name": webName,
            "web_url": webUrl,
            "login": login,
            "password": password,
            "comment": comment
        };

        data.accounts.push(account);
        
        await fs.writeFile('accounts.json', JSON.stringify(data, null, 2), 'utf-8');

        showmsg('Success!', 'Account added successfully!');

        await updateFromJson('accounts');
        await loadContentFromJson(`accounts.json`, masterpassword)
    } catch (err) {
        showmsg('Error', err, 'error');
    }
}

async function getNextId() {
    try {
        const data = await readJson('accounts.json');
        if (data.accounts.length === 0) return "001";
        const lastId = data.accounts[data.accounts.length - 1].id;
        const nextIdNum = parseInt(lastId) + 1;
        return nextIdNum.toString().padStart(3, "0");
    } catch (err) {
        showmsg('Error', err, 'error');
    }
}

async function updateBackground(last_bg=false) {
    const background = await readConfig('background');
    const body = document.querySelector('.root');

    if (background !== 'default') {
        try {
            body.style.backgroundImage = `url('${background}')`;
            if (last_bg !== 'default') {
                await fs.unlink(last_bg);
            }
            showmsg('Success!', 'Changes successfully applied');
        } catch (err) {
            showmsg('Error', err, 'error');
        }
    } else {
        if (last_bg !== 'default') {
            await fs.unlink(last_bg);
        }
        body.style.backgroundImage = 'none';
    }
}

async function showmsg(hName, pName, type = 'success') {
    const messageContainer = document.getElementById('messageContainer');
    
    const messageBox = document.createElement('div');
    messageBox.className = `message-box show`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageIcon = document.createElement('div');
    messageIcon.className = `message-icon ${type}-icon`;
    
    if (type === 'success') {
        messageIcon.textContent = '✓';
    } else if (type === 'error') {
        messageIcon.textContent = '!';
    } else if (type === 'info') {
        messageIcon.textContent = 'i';
    } else {
        messageIcon.textContent = '✓';
    }
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    const messageTitle = document.createElement('h3');
    messageTitle.textContent = hName;
    
    const messageParagraph = document.createElement('p');
    messageParagraph.textContent = pName;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    
    const progressBar = document.createElement('div');
    progressBar.className = `progress-bar ${type}-progress`;
    
    messageText.appendChild(messageTitle);
    messageText.appendChild(messageParagraph);
    
    messageContent.appendChild(messageIcon);
    messageContent.appendChild(messageText);
    messageContent.appendChild(closeBtn);
    
    messageBox.appendChild(messageContent);
    messageBox.appendChild(progressBar);
    
    messageContainer.appendChild(messageBox);
    
    function hideMessage() {
        messageBox.classList.remove('show');
        messageBox.classList.add('hide');
        
        setTimeout(() => {
            messageBox.remove();
        }, 500);
    }
    
    const timeoutId = setTimeout(() => {
        hideMessage();
    }, 5000);
    
    closeBtn.addEventListener('click', () => {
        clearTimeout(timeoutId);
        hideMessage();
    });
    
    messageBox.addEventListener('click', (e) => {
        if (e.target === messageBox) {
            clearTimeout(timeoutId);
            hideMessage();
        }
    });
}

async function exportAsJson(srcfilename, filename) {
    try {
        const data = await readJson(srcfilename);

        const jsonString = JSON.stringify(data, null, 2);

        const blob = new Blob([jsonString], { type: 'application/json' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        showmsg('Success!', 'Export completed!');
    } catch (err) {
        showmsg('Error', err, 'error');
    }
    
}

async function exportAsDb() {
  try {
    const dbData = await fs.readFile('accounts.db');
    
    const blob = new Blob([dbData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accounts.db';
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    showmsg('Success!', 'Export completed!');
  } catch (error) {
    showmsg('Error', err, 'error');
  }
}

function Copy(id) {
    showmsg('Information', 'Text copied to clipboard!', 'info');
    clipboard.writeText(id);
}

async function serverConnect(local) {
    
}