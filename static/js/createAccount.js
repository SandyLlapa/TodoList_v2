
document.getElementById('accountForm').addEventListener('submit',async(event)=>{
  event.preventDefault();
  // get user information
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // create account 
  try{
    const response = await fetch('/createAccount',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username,password})
    });
    
    if(!response.ok){
      throw new Error('Cannot create account');
    } 
    else{
      window.location.href='/home.html';
    }
  }
  catch(error){
    console.error(`Error creating account: ${error}`);
    alert("Failed to create account. Try again");
  }
});