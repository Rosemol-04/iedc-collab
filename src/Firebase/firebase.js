import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

const config = {
  apiKey: process.env.REACT_APP_FB_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
};

const initialize = () => {
  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  } else {
    firebase.app(); // if firebase is already initialized, use that instance
  }
};
export default initialize;

// Authentication functions
export const signIn = async (onSigninSuccess = () => {}) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });

  try {
    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;
    const userData = {
      name: user.displayName,
      email: user.email,
    };
    firebase
      .database()
      .ref("users/" + user.uid)
      .set(userData)
      .then(function () {
        console.log("User added sucessfully");
        onSigninSuccess();
      })
      .catch(function (error) {
        alert("Something went wrong");
        console.log(error);
      });
  } catch (error) {
    alert("Something is wrong, please check network connection");
    console.log(error);
  }
};

var defaultPhoto = 'https://images.unsplash.com/photo-1639413665566-2f75adf7b7ca?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwyN3x8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=60'

export const signOut = () => {
  firebase
    .auth()
    .signOut()
    .then(function () {
      console.log("Sign out successful");
    })
    .catch(function (error) {
      console.log("Sign out unsuccessful");
      alert("Something is wrong, please check network connection");
    });
};

export const doCreateProject = (obj) => {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Please login to add a project");
    return;
  }
  const leaderPhoto = user.providerData[0]?.photoURL;
  var newProjectID = firebase.database().ref().child("projects").push()
          .key;
  if(obj.projectPhoto) {       
  firebase
    .storage()
    .ref(`projectPhoto/${newProjectID}`)
    .put(obj.projectPhoto)
    .then(({ ref }) => {
      ref.getDownloadURL().then((url) => {
        let photo = url;
        const createdAt = Date.now();
        var projectData = {
          ...obj,
          name: obj.title,
          projectPhoto: photo,
          available: true,
          createdAt,
          updatedAt: createdAt,
          leader_id: user.uid,
          leader_name: user.displayName,
          leaderEmail: user.email,
          leaderImg: leaderPhoto || null,
        };
        console.log(projectData);

        firebase
          .database()
          .ref("projects/" + newProjectID)
          .set(projectData)
          .then(function () {
            console.log("Project added sucessfully");
            window.location.reload();
          })
          .catch(function (error) {
            alert("Something went wrong");
            console.log(error);
          });
      });
    });}
  else {
    const createdAt = Date.now();
    var projectData = {
      ...obj,
      name: obj.title,
      projectPhoto: defaultPhoto,
      available: true,
      createdAt,
      updatedAt: createdAt,
      leader_id: user.uid,
      leader_name: user.displayName,
      leaderEmail: user.email,
      leaderImg: leaderPhoto || null,
    };
    console.log(projectData);

    firebase
      .database()
      .ref("projects/" + newProjectID)
      .set(projectData)
      .then(function () {
        console.log("Project added sucessfully");
        window.location.reload();
      })
      .catch(function (error) {
        alert("Something went wrong");
        console.log(error);
      });
  } 
};

export const doDeleteProject = (project_id) => {
  let user = firebase.auth().currentUser;
  if (!user) {
    alert("Please login to add a project");
    return;
  }

  let projectRef = firebase.database().ref("projects/" + project_id);

  projectRef
    .child("leader_id")
    .once("value")
    .then(function (snapshot) {
      if (snapshot.val() !== user.uid) {
        return;
      }
    });
    firebase
    .storage()
    .ref(`projectPhoto/${project_id}`).delete()
  projectRef
    .remove()
    .then(function () {
      console.log("Project deleted sucessfully");
    })
    .catch(function (error) {
      alert("Something went wrong");
      console.log(error);
    });
};

export const doEditProject = async (obj,project_id) => {
  let user = firebase.auth().currentUser;
  if (!user) {
    alert("Please login to add a project");
    return;
  }
  let projectRef = firebase.database().ref("projects/" + project_id);
  projectRef
  .child("leader_id")
  .once("value")
  .then(function (snapshot) {
    if (snapshot.val() !== user.uid) {
      
      return;
    }
  });
  var photoUrl='';  
   projectRef.child("projectPhoto").once("value").then(await function(snapshot){if(snapshot.val()){photoUrl= snapshot.val()}
  else{return defaultPhoto}});

  if(obj.projectPhoto!==''){
 try{
  let imgDb = await firebase.storage().ref(`projectPhoto/${project_id}`)
  let newimg= await imgDb.put(obj.projectPhoto)
    photoUrl = await newimg.ref.getDownloadURL()
  }
  catch(error){
    alert("Something went wrong")
  }}
  let uid = user.uid;
  let leaderName = user.displayName;
  const createdAt = Date.now();
  
projectRef
  .set( {
    name: obj.title,
    desc: obj.desc,
    links: obj.links,
    contactNo: obj.contactNo,
    githubLink: obj.githubLink,
    tags: obj.tags,
    teamMembers: obj.teamMembers,
    projectPhoto: photoUrl,
    available: "true",
    updatedAt: createdAt,
    leader_id: uid,
    leader_name: leaderName,
  }

  )
  .then(function () {
    console.log("Project edited sucessfully");
  }).catch(function (error) {
    alert("Something went wrong");
    console.log(error);
  });
}



export const getProjects = () => {
  return firebase.database().ref("projects/").once("value");
};

export const getProject = (project_id) => {
  return firebase.database().ref("projects/").child(project_id).once("value");
};

export const getUser = (user_id) => {
  return firebase.database().ref("users/").child(user_id).once("value");
};
