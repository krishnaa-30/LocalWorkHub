
// Demo data loader for Local WorkHub
// Run this in the browser console once, or include it via <script src="demoData.js"></script>

(function(){
  const demoJobs = [
    // Cleaning
    { id:'job1', title:'Home Cleaning Helper', category:'Cleaning', pay:500, location:'Aziznagar', description:'Need someone to clean 2BHK flat and wash balcony.', contact:'clean@local.com', poster:'demoUser', postedAt:Date.now()-500000 },
    { id:'job2', title:'Office Cleaner', category:'Cleaning', pay:800, location:'Vikarabad', description:'Morning 3-hour office cleaning work.', contact:'cleanoffice@local.com', poster:'demoUser', postedAt:Date.now()-450000 },
    // Tutoring
    { id:'job3', title:'Math Tutor (Grade 8)', category:'Tutoring', pay:600, location:'Shankarpally', description:'Looking for an experienced tutor for 8th-grade math.', contact:'teach@local.com', poster:'demoUser', postedAt:Date.now()-400000 },
    { id:'job4', title:'Spoken English Tutor', category:'Tutoring', pay:700, location:'Aziznagar', description:'Help improve communication skills for a student.', contact:'english@local.com', poster:'demoUser', postedAt:Date.now()-350000 },
    // Delivery
    { id:'job5', title:'Grocery Delivery Partner', category:'Delivery', pay:450, location:'Vikarabad', description:'Deliver groceries in local neighborhoods.', contact:'delivery@local.com', poster:'demoUser', postedAt:Date.now()-300000 },
    { id:'job6', title:'Food Delivery Rider', category:'Delivery', pay:600, location:'Shankarpally', description:'Deliver restaurant food orders using a bike.', contact:'rider@local.com', poster:'demoUser', postedAt:Date.now()-250000 },
    // Construction
    { id:'job7', title:'Helper for Tile Work', category:'Construction', pay:900, location:'Aziznagar', description:'Assist with tile work for one day project.', contact:'tiles@local.com', poster:'demoUser', postedAt:Date.now()-200000 },
    { id:'job8', title:'Painter Needed', category:'Construction', pay:1200, location:'Vikarabad', description:'Paint small 1BHK house interior walls.', contact:'paint@local.com', poster:'demoUser', postedAt:Date.now()-150000 },
    // Gardening
    { id:'job9', title:'Garden Maintainer', category:'Gardening', pay:500, location:'Shankarpally', description:'Trim plants and water garden once a week.', contact:'garden@local.com', poster:'demoUser', postedAt:Date.now()-100000 },
    { id:'job10', title:'Lawn Cleaning Service', category:'Gardening', pay:650, location:'Aziznagar', description:'Clean up and maintain backyard lawn.', contact:'lawn@local.com', poster:'demoUser', postedAt:Date.now()-80000 },
    // Repair
    { id:'job11', title:'AC Repair Technician', category:'Repair', pay:1000, location:'Vikarabad', description:'Fix and clean split AC unit.', contact:'acfix@local.com', poster:'demoUser', postedAt:Date.now()-50000 },
    { id:'job12', title:'Bike Mechanic', category:'Repair', pay:750, location:'Shankarpally', description:'Tune and service two bikes.', contact:'bike@local.com', poster:'demoUser', postedAt:Date.now()-40000 }
  ];

  const acceptedJobs = [
    Object.assign({}, demoJobs[1], { acceptedBy: 'worker01', acceptedAt: Date.now()-20000 })
  ];

  const users = {
    demoUser: '12345',
    worker01: 'worker'
  };

  localStorage.setItem('localworkhub_jobs_v1', JSON.stringify(demoJobs));
  localStorage.setItem('localworkhub_accepted_v1', JSON.stringify(acceptedJobs));
  localStorage.setItem('LocalWorkHub_users', JSON.stringify(users));
  localStorage.setItem('LocalWorkHub_loggedIn', 'demoUser');

  alert('✅ Demo data loaded successfully! You are logged in as demoUser (password: 12345)');
})();
