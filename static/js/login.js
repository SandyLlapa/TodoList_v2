// login 

document.getElementById('login').addEventListener('submit',async(event)=>{

  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try{
    const response = await fetch('/login',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username,password})
    });
    
    if(!response.ok){ // check status 
        throw new Error('Incorrect password/username');
    } 
    else{ // redirect to contacts.html
      window.location.href='/home.html';
    }
  }
  catch(error){ // username/password not in database
    console.error(`Error logging in: ${error}`);
    alert("Incorrect username/passowrd");
  }
});