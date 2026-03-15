async function readConfig(key) {
  try {
    const rawData = await fs.readFile('config.json', 'utf8');
    const cfg = JSON.parse(rawData).config;
    return cfg[key];
  } catch (err) {
    const data = {
      config: {
        local: true,
        background: "default",
        font_color: "",
        video_protection: false,
        discord_protection: false
      }
    }
    await fs.writeFile('config.json', JSON.stringify(data, null, 2), 'utf8');
    await readConfig();
  }
}

async function updateDialogByConfig() {
  if (await readConfig('local')) {document.getElementById('local-cb').checked = true} else {document.getElementById('local-cb').checked = false}
  if (await readConfig('video_protection')) {document.getElementById('video_protection-cb').checked = true} else {document.getElementById('video_protection-cb').checked = false}
  if (await readConfig('discord_protection')) {document.getElementById('discord_protection-cb').checked = true} else {document.getElementById('discord_protection-cb').checked = false}
}


document.addEventListener('DOMContentLoaded', updateDialogByConfig);


async function updateConfig(key, value) {
  try {
    const data = await fs.readFile('config.json', 'utf8');
    const jsonData = JSON.parse(data);
    
    jsonData.config[key] = value;
    
    await fs.writeFile('config.json', JSON.stringify(jsonData, null, 2));
    return true;
  } catch (err) {
    console.error(`Error updating ${key}:`, err);
    return false;
  }
}

async function video_protect() {
  try {
    showmsg('Success!', 'Video protect enabled!');
    setInterval(async () => {
      const detected = await checkScreenCaptureApps();
      const blurDiv = document.getElementById('blurDg');
      const deleteBlurBtn = localStorage.getItem('isShowBtnPressed');

      console.log(deleteBlurBtn);

      if (detected && deleteBlurBtn === 'false') {
        console.log(detected);
        blurDiv.style.display = 'flex';
      } else {
        blurDiv.style.display = 'none';
      }
    }, 1000);
  } catch (err) {
    showmsg('Error', err, 'error');
  }
}

async function checkScreenCaptureApps() {
  try {
    const processes = await psList();
    const dangerousKeywords = [
      'obs', 'bandicam', 'fraps', 'xsplit', 
      'geforce experience', 'shadowplay',
      'radeon software', 'screenflow'
    ];

    for (const proc of processes) {
      if (dangerousKeywords.some(keyword => 
        proc.name.toLowerCase().includes(keyword)
      )) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Ошибка при проверке процессов:', err);
    return false;
  }
}

async function discord_protect() {
    
}

document.getElementById('local').addEventListener('change', function(e) {
  updateConfig('local', e.target.checked)
  if (e.target.checked) {
    document.getElementById('').style.display = 'none';
  }
  showmsg('Information', 'Feature in development...', 'info');
});

document.getElementById('video_protection').addEventListener('change', function(e) {
  updateConfig('video_protection', e.target.checked)
  if (e.target.checked) {video_protect()}
});

document.getElementById('discord_protection').addEventListener('change', function(e) {
  updateConfig('discord_protection', e.target.checked)
  showmsg('Information', 'Feature in development...', 'info');
  if (e.target.checked) {discord_protect()}
});