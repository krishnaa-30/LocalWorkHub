// app.js — Final version (includes Chat system + Dark mode + Access control)
(function(){
  const LS_KEY = 'localworkhub_jobs_v1';
  const LS_ACCEPTED_KEY = 'localworkhub_accepted_v1';

  // === Utility storage ===
  function sampleJobs(){
    return [];
  }
  function loadJobs(){
    try{ const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : sampleJobs(); }
    catch(e){ return sampleJobs(); }
  }
  function saveJobs(jobs){ localStorage.setItem(LS_KEY, JSON.stringify(jobs)); }

  function loadAccepted(){
    try{ const raw = localStorage.getItem(LS_ACCEPTED_KEY); return raw ? JSON.parse(raw) : []; }
    catch(e){ return []; }
  }
  function saveAccepted(list){ localStorage.setItem(LS_ACCEPTED_KEY, JSON.stringify(list)); }

  function formatDate(ts){ return new Date(ts).toLocaleString(); }

  // === Job Card ===
  function createJobCard(job, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'job-card';
    const left = document.createElement('div');
    left.style.flex = '1';

    const title = document.createElement('h3');
    title.textContent = job.title;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${job.category || '—'} • ${job.location || '—'} • ₹${job.pay || 0}`;

    const desc = document.createElement('p');
    desc.textContent = job.description || '';

    const contact = document.createElement('p');
    contact.className = 'muted';
    contact.textContent = `Posted by: ${job.poster || 'Anonymous'}`;

    left.append(title, meta, desc, contact);

    const right = document.createElement('div');
    right.className = 'job-actions';

    if (opts.showContactLink && job.contact) {
      const mail = document.createElement('a');
      mail.href = `mailto:${job.contact}`;
      mail.textContent = 'Contact';
      mail.className = 'btn btn-contact';
      right.appendChild(mail);
    }

    if (opts.showAcceptBtn) {
  const btn = document.createElement('button');
  btn.textContent = 'Accept Job';
  btn.className = 'btn btn-accept';

  // Disable if user is not logged in
  const loggedInUser = localStorage.getItem('LocalWorkHub_loggedIn');
  if (!loggedInUser) {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.title = 'Please log in to accept jobs';
    btn.onclick = () => alert('You must log in before accepting a job.');
  } else {
    btn.onclick = () => opts.onAccept && opts.onAccept(job);
  }

  right.appendChild(btn);
}


    if (opts.showDelete) {
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.className = 'btn btn-delete';
      del.onclick = () => opts.onDelete && opts.onDelete(job);
      right.appendChild(del);
    }

    if (opts.showChat) {
      const chatBtn = document.createElement('a');
      chatBtn.textContent = 'Open Chat';
      chatBtn.className = 'btn btn-primary';
      chatBtn.href = `chat.html?job=${encodeURIComponent(job.id)}`;
      right.appendChild(chatBtn);
    }

    wrap.append(left, right);
    return wrap;
  }

  // === MAIN LOGIC ===
  document.addEventListener('DOMContentLoaded', function(){
    const path = window.location.pathname.split('/').pop() || 'index.html';

    // === LOGIN CHECK ===
    const loggedIn = localStorage.getItem('LocalWorkHub_loggedIn');
    const publicPages = ['login.html', 'signup.html', 'index.html'];
    if (!loggedIn && !publicPages.includes(path)) {
      window.location.href = 'login.html';
      return;
    }

// === LOGIN / LOGOUT DYNAMIC HEADER ===
const header = document.querySelector('.site-header');
const nav = header?.querySelector('nav');
const existingWelcome = document.getElementById('welcomeUser');
if (existingWelcome) existingWelcome.remove();

if (nav) {
  const loginLink = Array.from(nav.querySelectorAll('a')).find(a => a.href.includes('login.html'));

  if (loggedIn) {
    // Hide Login link if present
    if (loginLink) loginLink.style.display = 'none';

    // Create welcome message below heading
    const welcome = document.createElement('div');
    welcome.id = 'welcomeUser';
    welcome.innerHTML = `
      <span style="
        background: linear-gradient(135deg, #3b82f6, #facc15);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
        font-size: 1.1rem;
        display: block;
        margin-top: 8px;
      ">
        👋 Welcome, ${loggedIn}!
      </span>
    `;
    // Insert below header logo
    header.appendChild(welcome);

    // Add Logout link in navbar
    const logout = document.createElement('a');
    logout.textContent = 'Logout';
    logout.href = '#';
    logout.style.marginLeft = '12px';
    logout.onclick = () => {
      localStorage.removeItem('LocalWorkHub_loggedIn');
      window.location.href = 'index.html';
    };
    nav.append(logout);
  } else {
    // Show login link normally
    if (loginLink) loginLink.style.display = 'inline';
  }
}



    // === NAV ACTIVE ===
    document.querySelectorAll('.site-header nav a').forEach(a=>{
      const href = a.getAttribute('href') || '';
      if (href === path || (href === 'index.html' && path === '')) a.classList.add('active');
    });

    // === INDEX PAGE ===
    if (path === '' || path === 'index.html') return;

    // === POST JOB PAGE ===
    if (path === 'post.html') {
      const form = document.getElementById('postForm');
      const msg = document.getElementById('postMessage');
      if (!form) return;

      form.addEventListener('submit', e=>{
        e.preventDefault();
        const fd = new FormData(form);
        const loggedInUser = localStorage.getItem('LocalWorkHub_loggedIn');
        const job = {
          id: 'job_' + Date.now(),
          title: fd.get('title').trim(),
          category: fd.get('category').trim(),
          pay: Number(fd.get('pay') || 0),
          location: fd.get('location').trim(),
          description: fd.get('description').trim(),
          contact: fd.get('contact').trim(),
          postedAt: Date.now(),
          poster: loggedInUser
        };
        const jobs = loadJobs();
        jobs.unshift(job);
        saveJobs(jobs);
        msg.textContent = 'Job posted successfully!';
        form.reset();
        setTimeout(()=>window.location.href='browse.html',800);
      });
      return;
    }

    // === BROWSE PAGE ===
    if (path === 'browse.html') {
      const listEl = document.getElementById('jobsList');
      const search = document.getElementById('searchInput');
      const chipsContainer = document.getElementById('categoryChips');
      const loggedInUser = localStorage.getItem('LocalWorkHub_loggedIn');

      function render(){
        listEl.innerHTML = '';
        const all = loadJobs();
        const q = (search.value || '').toLowerCase();
        const cats = Array.from(new Set(all.map(j => j.category && j.category.trim()).filter(Boolean)));
        chipsContainer.innerHTML = '';
        let currentCat = chipsContainer.getAttribute('data-active') || '';

        // Chips
        const allChip = document.createElement('div');
        allChip.textContent = 'All';
        allChip.className = 'chip' + (currentCat === '' ? ' active' : '');
        allChip.onclick = ()=>{ chipsContainer.setAttribute('data-active',''); render(); };
        chipsContainer.appendChild(allChip);
        cats.forEach(cat=>{
          const chip=document.createElement('div');
          chip.textContent=cat;
          chip.className='chip'+(currentCat===cat?' active':'');
          chip.onclick=()=>{chipsContainer.setAttribute('data-active',cat); render();};
          chipsContainer.appendChild(chip);
        });
        currentCat = chipsContainer.getAttribute('data-active') || '';

        const filtered = all.filter(j=>{
          if (currentCat && j.category !== currentCat) return false;
          if (!q) return true;
          return (j.title+j.description+j.location).toLowerCase().includes(q);
        });

        if (!filtered.length){
          const empty=document.createElement('div');
          empty.className='muted';
          empty.textContent='No jobs found.';
          listEl.appendChild(empty);
        } else {
          filtered.forEach(job=>{
            const card=createJobCard(job,{
              showAcceptBtn:true,
              showContactLink:true,
              showDelete: job.poster===loggedInUser,
              onAccept:function(j){
                const accepted=loadAccepted();
                accepted.unshift({...j,acceptedAt:Date.now(),acceptedBy:loggedInUser});
                saveAccepted(accepted);
                const jobsLeft=loadJobs().filter(x=>x.id!==j.id);
                saveJobs(jobsLeft);
                alert('You accepted: '+j.title);
                render();
              },
              onDelete:function(j){
                if(confirm('Delete this job?')){
                  const next=loadJobs().filter(x=>x.id!==j.id);
                  saveJobs(next);
                  render();
                }
              }
            });
            listEl.appendChild(card);
          });
        }
      }
      search.addEventListener('input',render);
      render();
      return;
    }

    // === ACCEPTED JOBS PAGE ===
    if (path === 'accepted.html') {
      const listEl = document.getElementById('acceptedList');
      const loggedInUser = localStorage.getItem('LocalWorkHub_loggedIn');

      function renderAccepted(){
        listEl.innerHTML = '';
        const accepted = loadAccepted().filter(j=>j.acceptedBy===loggedInUser);
        if (!accepted.length){
          const p=document.createElement('p');
          p.className='muted';
          p.textContent='You haven’t accepted any jobs yet.';
          listEl.appendChild(p);
          return;
        }
        accepted.forEach(job=>{
          const card=createJobCard(job,{
            showContactLink:true,
            showAcceptBtn:false,
            showDelete:true,
            showChat:true,
            onDelete:function(j){
              if(confirm('Unaccept this job?')){
                const rest=loadAccepted().filter(x=>x.id!==j.id);
                saveAccepted(rest);
                const jobs=loadJobs();
                jobs.unshift({...j,postedAt:Date.now()});
                saveJobs(jobs);
                renderAccepted();
              }
            }
          });
          listEl.appendChild(card);
        });
      }
      renderAccepted();
      return;
    }
    // === MY POSTED JOBS PAGE ===
if (path === 'myjobs.html') {
  const listEl = document.getElementById('myJobsList');
  const loggedInUser = localStorage.getItem('LocalWorkHub_loggedIn');
  const allJobs = loadJobs();
  const acceptedJobs = loadAccepted();

  // Filter jobs posted by current user
  const myJobs = allJobs.filter(j => j.poster === loggedInUser);

  listEl.innerHTML = '';

  if (!myJobs.length) {
    const msg = document.createElement('p');
    msg.className = 'muted';
    msg.textContent = 'You have not posted any jobs yet.';
    listEl.appendChild(msg);
    return;
  }

  myJobs.forEach(job => {
    const card = createJobCard(job, {
      showContactLink: false,
      showAcceptBtn: false,
      showDelete: true,
      onDelete: function(j) {
        if (confirm('Delete this posted job?')) {
          const next = loadJobs().filter(x => x.id !== j.id);
          saveJobs(next);
          window.location.reload();
        }
      }
    });

    // Find who accepted it (if anyone)
    const accepted = acceptedJobs.find(a => a.id === job.id);
    const status = document.createElement('p');
    status.className = 'muted';

    if (accepted && accepted.acceptedBy) {
      status.innerHTML = `Accepted by: <strong>${accepted.acceptedBy}</strong> `;
      const chatBtn = document.createElement('a');
      chatBtn.textContent = 'Chat';
      chatBtn.className = 'btn btn-primary';
      chatBtn.href = `chat.html?job=${encodeURIComponent(job.id)}`;
      status.appendChild(chatBtn);
    } else {
      status.textContent = 'No one has accepted this job yet.';
    }

    card.appendChild(status);
    listEl.appendChild(card);
  });

  return;
}


    // === CHAT PAGE ===
    if (path === 'chat.html') {
      const params = new URLSearchParams(window.location.search);
      const jobId = params.get('job');
      const jobTitle = document.getElementById('jobTitle');
      const acceptedBy = document.getElementById('acceptedBy');
      const chatBox = document.getElementById('chatBox');
      const chatForm = document.getElementById('chatForm');
      const chatInput = document.getElementById('chatInput');
      const loggedInUser = localStorage.getItem('LocalWorkHub_loggedIn');

      const allAccepted = loadAccepted();
      const job = allAccepted.find(j => j.id === jobId);
      if (!job){
        document.getElementById('jobInfo').innerHTML = '<p>No chat found for this job.</p>';
        chatForm.style.display='none';
        return;
      }

      jobTitle.textContent = job.title;
      acceptedBy.textContent = job.acceptedBy || 'Unknown';

      const CHAT_KEY = `chat_${jobId}`;
      let messages = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');

      function renderChat(){
        chatBox.innerHTML='';
        messages.forEach(m=>{
          const msg = document.createElement('p');
          msg.innerHTML = `<strong>${m.sender}:</strong> ${m.text}`;
          chatBox.appendChild(msg);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
      }
      renderChat();

      chatForm.addEventListener('submit', e=>{
        e.preventDefault();
        const text = chatInput.value.trim();
        if(!text) return;
        const msgObj = {sender: loggedInUser, text, time: Date.now()};
        messages.push(msgObj);
        localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
        chatInput.value='';
        renderChat();
      });
      return;
    }

  });

})();
