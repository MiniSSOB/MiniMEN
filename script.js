document.getElementById('loginForm').addEventListener('submit', function(event) {
  // Prevents the page from immediately refreshing when you click login
  event.preventDefault(); 

  // Grab the values the user typed in
  const name = document.getElementById('name').value;
  const username = document.getElementById('username').value;

  // A classic 2000s-style alert box to confirm it works
  alert(`ACCESS GRANTED.\n\nWelcome to the battlefield, ${name} (${username}).`);
});
