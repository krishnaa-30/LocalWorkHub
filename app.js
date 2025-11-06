// app.js — Final integrated version
(function(){
  const LS_KEY = 'localworkhub_jobs_v1';
  const LS_ACCEPTED_KEY = 'localworkhub_accepted_v1';

  function sampleJobs(){ return []; }

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

  // Job card factory
  function createJobCard(job, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'job-card';

    const left = document.createElement('div');
    left.style.flex = '1';

    const title = document.createElement('h3'); title.textContent = job.title;
    const meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = `${job.category || '—'} • ${job.location || '—'} • ₹${job.pay || 0}`;

    const desc = document.createElement('p'); desc.textContent = job.description || '';
    const poster = document.createElement('p'); poster.className = 'muted'; poster.textContent = `Posted by: ${job.poster || job.contact || 'Anonymous'}`;

    left.appendChild(title);
    left.appendChild(meta);
    left.appendChild(desc);
    left.appendChild(poster);

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

      const loggedInUser = localStorage.getItem('LocalWorkHub_loggedIn');
      if (!loggedInUser) {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.title = 'Please log in to accept jobs';
        btn.onclick = () => alert('Please log in to accept jobs.');
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
      const link = document.createElement('a');
      link.textContent = 'Chat';
      link.className = 'btn btn-primary';
      link.href = `chat.html?job=${encodeURIComponent(job.id)}`;
      right.appendChild(link);
    }

    wrap.appendChild(left);
    wrap.appendChild(right);
    return wrap;
  }

  // DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const loggedIn = localStorage.getItem('LocalWorkHub_loggedIn');
    const publicPages = ['login.html','signup.html','index.html'];

    // redirect to login if protected page and not logged in
    if (!loggedIn && !publicPages.includes(path)) {
      window.location.href = 'login.html';
      return;
    }

    // header: show welcome below heading and hide login when logged
    const header = document.querySelector('.site-header');
    const nav = header?.querySelector('nav');

    // remove existing welcome if any
    const existingWelcome = document.getElementById('welcomeUser');
    if (existingWelcome) existingWelcome.remove();

    if (nav) {
      const loginLink = Array.from(nav.querySelectorAll('a')).find(a => a.getAttribute('href') && a.getAttribute('href').includes('login.html'));

      if (loggedIn) {
        if (loginLink) loginLink.style.display = 'none';

        // welcome block below header
        const welcome = document.createElement('div');
        welcome.id = 'welcomeUser';
        welcome.style.textAlign = 'center';
        welcome.style.padding = '6px 0 0';
        welcome.innerHTML = `<span style="background:linear-gradient(135deg,var(--accent), #facc15); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-weight:700; font-size:1.05rem; display:block;">👋 Welcome, ${loggedIn}!</span>`;
        header.appendChild(welcome);

        const logout = document.createElement('a');
        logout.textContent = 'Logout';
        logout.href = '#';
        logout.style.marginLeft = '12px';
        logout.onclick = () => {
          localStorage.removeItem('LocalWorkHub_loggedIn');
          window.location.href = 'index.html';
        };
        nav.appendChild(logout);
      } else {
        if (loginLink) loginLink.style.display = 'inline';
      }
    }

    // nav active highlight
    document.querySelectorAll('.site-header nav a').forEach(a=>{
      const href = a.getAttribute('href') || '';
      if (href === path || (href === 'index.html' && path === '')) a.classList.add('active');
    });

    // INDEX - nothing dynamic
    if (path === '' || path === 'index.html') return;

    // POST PAGE
    if (path === 'post.html') {
      const form = document.getElementById('postForm');
      const msg = document.getElementById('postMessage');
      if (!form) return;
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const fd = new FormData(form);
        const poster = localStorage.getItem('LocalWorkHub_loggedIn');
        if (!poster) { msg.textContent = 'Please login to post jobs.'; return; }
        const job = {
          id: 'job_' + Date.now(),
          title: (fd.get('title')||'').trim(),
          category: (fd.get('category')||'').trim(),
          pay: Number(fd.get('pay')||0),
          location: (fd.get('location')||'').trim(),
          description: (fd.get('description')||'').trim(),
          contact: (fd.get('contact')||'').trim(),
          postedAt: Date.now(),
          poster
        };
        const jobs = loadJobs();
        jobs.unshift(job);
        saveJobs(jobs);
        form.reset();
        msg.textContent = 'Job posted! Redirecting to Browse...';
        setTimeout(()=> window.location.href = 'browse.html',700);
      });
      return;
    }

    // BROWSE PAGE
    if (path === 'browse.html') {
      const listEl = document.getElementById('jobsList');
      const search = document.getElementById('searchInput');
      const chipsContainer = document.getElementById('categoryChips');

      function render(){
        listEl.innerHTML = '';
        const all = loadJobs();
        const q = (search.value || '').toLowerCase();

        // categories -> chips
        const cats = Array.from(new Set(all.map(j => j.category && j.category.trim()).filter(Boolean)));
        chipsContainer.innerHTML = '';
        let currentCat = chipsContainer.getAttribute('data-active') || '';

        const allChip = document.createElement('div');
        allChip.textContent = 'All';
        allChip.className = 'chip' + (currentCat === '' ? ' active' : '');
        allChip.onclick = ()=>{ chipsContainer.setAttribute('data-active',''); render(); };
        chipsContainer.appendChild(allChip);

        cats.forEach(cat=>{
          const chip = document.createElement('div');
          chip.textContent = cat;
          chip.className = 'chip' + (currentCat === cat ? ' active' : '');
          chip.onclick = ()=>{ chipsContainer.setAttribute('data-active', cat); render(); };
          chipsContainer.appendChild(chip);
        });

        currentCat = chipsContainer.getAttribute('data-active') || '';

        const filtered = all.filter(j => {
          if (currentCat && j.category !== currentCat) return false;
          if (!q) return true;
          return (j.title + ' ' + (j.description||'') + ' ' + (j.location||'')).toLowerCase().includes(q);
        });

        if (!filtered.length) {
          const empty = document.createElement('div'); empty.className = 'muted'; empty.textContent = 'No jobs found.'; listEl.appendChild(empty);
        } else {
          filtered.forEach(job=>{
            const card = createJobCard(job, {
              showAcceptBtn: true,
              showContactLink: true,
              showDelete: job.poster === localStorage.getItem('LocalWorkHub_loggedIn'),
              onAccept: function(j){
                const accepted = loadAccepted();
                accepted.unshift(Object.assign({}, j, { acceptedAt: Date.now(), acceptedBy: localStorage.getItem('LocalWorkHub_loggedIn') }));
                saveAccepted(accepted);
                const jobsLeft = loadJobs().filter(x => x.id !== j.id);
                saveJobs(jobsLeft);
                alert('Accepted: ' + j.title);
                render();
              },
              onDelete: function(j){
                if (!confirm('Delete this job?')) return;
                const next = loadJobs().filter(x => x.id !== j.id);
                saveJobs(next);
                render();
              }
            });
            listEl.appendChild(card);
          });
        }
      }

      search.addEventListener('input', render);
      render();
      return;
    }

    // MY POSTED JOBS
    if (path === 'myjobs.html') {
      const listEl = document.getElementById('myJobsList');
      const logged = localStorage.getItem('LocalWorkHub_loggedIn');
      const allJobs = loadJobs();
      const accepted = loadAccepted();

      const mine = allJobs.filter(j => j.poster === logged);
      listEl.innerHTML = '';

      if (!mine.length) {
        const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'You have not posted any jobs yet.'; listEl.appendChild(p);
        return;
      }

      mine.forEach(job=>{
        const card = createJobCard(job, {
          showContactLink: false,
          showAcceptBtn: false,
          showDelete: true,
          onDelete: function(j){
            if (!confirm('Delete this posted job?')) return;
            const next = loadJobs().filter(x => x.id !== j.id);
            saveJobs(next);
            window.location.reload();
          }
        });

        const found = accepted.find(a => a.id === job.id);
        const status = document.createElement('p'); status.className = 'muted';
        if (found && found.acceptedBy) {
          status.innerHTML = `Accepted by: <strong>${found.acceptedBy}</strong> `;
          const chatBtn = document.createElement('a'); chatBtn.textContent = 'Chat'; chatBtn.className = 'btn btn-primary'; chatBtn.href = `chat.html?job=${encodeURIComponent(job.id)}`;
          status.appendChild(chatBtn);
        } else {
          status.textContent = 'No one has accepted this job yet.';
        }
        card.appendChild(status);
        listEl.appendChild(card);
      });
      return;
    }

    // ACCEPTED JOBS PAGE
    if (path === 'accepted.html') {
      const listEl = document.getElementById('acceptedList');
      const logged = localStorage.getItem('LocalWorkHub_loggedIn');
      listEl.innerHTML = '';
      const accepted = loadAccepted().filter(j => j.acceptedBy === logged);

      if (!accepted.length) {
        const p = document.createElement('p'); p.className = 'muted'; p.textContent = "You haven't accepted any jobs yet."; listEl.appendChild(p);
        return;
      }

      accepted.forEach(job=>{
        const card = createJobCard(job, {
          showContactLink: true,
          showAcceptBtn: false,
          showDelete: true,
          showChat: true,
          onDelete: function(j){
            if (!confirm('Remove from accepted list and return to Browse?')) return;
            const rest = loadAccepted().filter(x => x.id !== j.id);
            saveAccepted(rest);
            const jobs = loadJobs();
            jobs.unshift(Object.assign({}, j, { postedAt: Date.now() }));
            saveJobs(jobs);
            window.location.reload();
          }
        });
        listEl.appendChild(card);
      });
      return;
    }

    // CHAT PAGE
    if (path === 'chat.html') {
      const params = new URLSearchParams(window.location.search);
      const jobId = params.get('job');
      const logged = localStorage.getItem('LocalWorkHub_loggedIn');
      const jobTitleEl = document.getElementById('jobTitle');
      const acceptedByEl = document.getElementById('acceptedBy');
      const chatBox = document.getElementById('chatBox');
      const chatForm = document.getElementById('chatForm');
      const chatInput = document.getElementById('chatInput');

      const accepted = loadAccepted();
      const job = accepted.find(j => j.id === jobId);

      if (!job) {
        document.getElementById('jobInfo').innerHTML = '<p>No chat available for this job.</p>';
        if (chatForm) chatForm.style.display = 'none';
        return;
      }

      jobTitleEl.textContent = job.title;
      acceptedByEl.textContent = job.acceptedBy || 'Unknown';

      const CHAT_KEY = `chat_${jobId}`;
      let messages = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');

      function renderChat(){
        chatBox.innerHTML = '';
        messages.forEach(m=>{
          const div = document.createElement('div');
          div.style.marginBottom = '8px';
          div.innerHTML = `<strong style="color:var(--accent)">${m.sender}</strong>: <span style="color:var(--text)">${m.text}</span>`;
          chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
      }
      renderChat();

      if (chatForm) {
        chatForm.addEventListener('submit', e=>{
          e.preventDefault();
          const text = chatInput.value.trim();
          if (!text) return;
          const msg = { sender: logged || 'Guest', text, time: Date.now() };
          messages.push(msg);
          localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
          chatInput.value = '';
          renderChat();
        });
      }
      return;
    }

  }); // DOMContentLoaded end

})(); // IIFE end
