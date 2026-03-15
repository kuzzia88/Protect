const fontSlider = document.querySelector('.font-slider');
const resetFontBtn = document.querySelector('.reset-font-color-btn')
const buttonText = document.getElementById('buttonText');
let isOpen = false;
const { ipcRenderer } = require('electron');
        
window.electron = {
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close')
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && isOpen) {
    toggleMenu();
  }
});

document.getElementById('accountAddForm').addEventListener('submit', async function(event) {
  const masterPassword = document.getElementById('masterInput').value.trim();
  event.preventDefault();
  const id = await getNextId();
  
  const errorElement = document.getElementById('account-errors');
  const name = await encryptText(document.getElementById('nameInput').value, masterPassword);
  const url = await encryptText(document.getElementById('urlInput').value, masterPassword);
  const login = await encryptText(document.getElementById('loginInput').value, masterPassword);
  const password = await encryptText(document.getElementById('passwordInput').value, masterPassword);
  const comment = await encryptText(document.getElementById('commentInput').value, masterPassword);
  const savedEncrypted = localStorage.getItem('masterPasswordCheck');

  const newEncrypted = await encryptText("verification_string", masterPassword);

  if (newEncrypted === savedEncrypted) {
    await createAccount(id, name, url, login, password, comment, masterPassword); 
  } else {
    errorElement.textContent = "Invalid password";
  }
});

document.getElementById('saveMasterPassword').addEventListener('click', async () => {
  const newPassword = document.getElementById('newMasterPassword').value.trim();
  const confirmPassword = document.getElementById('confirmMasterPassword').value.trim();
  
  if (!newPassword) {
    alert('Password cannot be empty!');
    return;
  }

  if (newPassword !== confirmPassword) {
    document.getElementById('setupError').textContent = 'Passwords do not match';
    return;
  }
  
  if (newPassword.length < 8) {
    document.getElementById('setupError').textContent = 'Password must be at least 8 characters';
    return;
  }

  try {
    const encryptedTest = await encryptText('verification_string', newPassword);
    
    localStorage.setItem('masterPasswordCheck', encryptedTest);
    localStorage.setItem('masterPasswordSet', 'true');
    localStorage.setItem('firstTime', 'false');
    
    document.getElementById('setupModal').style.display = 'none';
    await loadContent('accounts', await readConfig('local'), newPassword);
    showmsg('Success!', 'You are logged in!');
  } catch (error) {
    console.error('Setup error:', error);
    document.getElementById('setupError').textContent = 'Setup failed: ' + error.message;
  }
});

document.getElementById('MasterPasswordBtn').addEventListener('click', async () => {
  const password = document.getElementById('masterPassword').value;
  const errorElement = document.getElementById('setupErrorS');
  
  if (!password) {
    errorElement.textContent = "Please enter password";
    return;
  }

  try {
    const savedEncrypted = localStorage.getItem('masterPasswordCheck');
    if (!savedEncrypted) {
      errorElement.textContent = "Master password not configured";
      return;
    }

    const newEncrypted = await encryptText("verification_string", password);

    if (newEncrypted === savedEncrypted) {
      localStorage.setItem('masterPasswordSet', 'true');
      document.getElementById('master-password-check').style.display = 'none';
      errorElement.textContent = "";
      const video_protection = await readConfig('video_protection');

      if (video_protection) {video_protect()}
      await loadContent('accounts', await readConfig('local'), password);
    } else {
      errorElement.textContent = "Invalid password";
    }
    showmsg('Success!', 'You are logged in!');
  } catch (error) {
    console.error("Password verification failed:", error);
    errorElement.textContent = "Invalid password";
  }
});

document.getElementById('compactFile').addEventListener('change', async (e) => {
  const fileInput = document.getElementById('compactFile');
  
  if (fileInput.files.length === 0) {
    alert('Пожалуйста, выберите файл');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  const last_bg = await readConfig('background');

  await updateConfig('background', file.name);

  reader.onload = (event) => {
    const buffer = Buffer.from(event.target.result);
    
    ipcRenderer.send('save-image', {
      fileName: file.name,
      buffer: buffer
    });
  };

  reader.readAsArrayBuffer(file);

  setTimeout(async () => {
    await updateBackground(last_bg); 
  }, 500);
});

fontSlider.addEventListener('input', async function () {
  document.documentElement.style.setProperty('--font-color', document.querySelector('.font-slider').value);
  localStorage.setItem('font-color', document.querySelector('.font-slider').value);
});

resetFontBtn.addEventListener('click', async function () {
  document.documentElement.style.setProperty('--font-color', '#fff');
  localStorage.setItem('font-color', '#fff');
});

document.querySelector('.reset-bg-btn').addEventListener('click', async (e) => {
  const last_bg = await readConfig('background');
  await updateConfig('background', 'default');
  showmsg('Success!', 'Background successfully changed!');
  await updateBackground(last_bg);
});

document.getElementById('exportJson').addEventListener('click', async (e) => {
  await exportAsJson('accounts.json', 'accounts.json');
});

document.getElementById('exportDb').addEventListener('click', async (e) => {
  await exportAsDb();
});

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  
  if (!file) {
    return;
  }

  const allowedExtensions = ['.json', '.db'];
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  const isValidExtension = allowedExtensions.includes(extension);

  const allowedMimeTypes = ['application/json'];
  const isValidMimeType = file.type === '' || allowedMimeTypes.includes(file.type);

  if (!isValidExtension || !isValidMimeType) {
    errorText.textContent = 'Разрешены только файлы .json и .db';
    fileInput.value = '';
    return;
  }

  if (extension === '.json') {
    try {
      const data = await readJson('accounts.json');
      const imported = await file.text();
      const importedData = JSON.parse(imported);

      await saveJson('accounts.json', importedData);
    } catch (e) {
      fileInput.value = '';
      return;
    }
  } else {
    showmsg('Information', 'You can only import .json files!', 'info');
  }
});

document.getElementById('showBtn').addEventListener('click', async (e) => {
  const firstLoginElement = document.querySelector('.login');

  if (firstLoginElement && firstLoginElement.style.webkitTextSecurity === 'none') {
    document.querySelectorAll('.login, .password').forEach(element => {
      element.style.webkitTextSecurity = 'disc';
    });
  } else {
    document.querySelectorAll('.login, .password').forEach(element => {
      element.style.webkitTextSecurity = 'none';
    });
  }
  
  showmsg('Information', 'Logins and passwords are shown!', 'info');
});

document.getElementById('showContainerBtn').addEventListener('click', async (e) => {
  localStorage.setItem('isShowBtnPressed', 'true')
});

document.getElementById('blockBtn').addEventListener('click', async (e) => {
  document.getElementById('masterPassword').value = '';
  document.getElementById('master-password-check').style.display = 'flex';
});

async function saveJson(filename, data) {
  try {
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
  } catch (err) {
    showmsg('Save Error', err.message, 'error');
    throw err;
  }
}

async function checkMasterPassword() {
  return localStorage.getItem('masterPasswordSet') === 'true';
}

setInterval(() => {
  const checkModal = document.getElementById('master-password-check');
  if (!checkModal) {
    checkModal.style.display = checkMasterPassword() ? 'flex' : 'none';
  }
}, 500);

start();