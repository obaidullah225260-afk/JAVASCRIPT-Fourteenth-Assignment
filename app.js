import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.12.2/+esm";

document.addEventListener("DOMContentLoaded", () => {
  let isLogin = true;
  let editingPostId = null;
  let currentUser = null;
  let allPosts = [];
  const els = {
    /* same as before */ themeBtn: document.getElementById("themeBtn"),
    togglePass: document.getElementById("togglePass"),
    password: document.getElementById("password"),
    postDesc: document.getElementById("postDesc"),
    charCount: document.getElementById("charCount"),
    toggleAuth: document.getElementById("toggleAuth"),
    authTitle: document.getElementById("authTitle"),
    authBtn: document.getElementById("authBtn"),
    username: document.getElementById("username"),
    email: document.getElementById("email"),
    authError: document.getElementById("authError"),
    authSuccess: document.getElementById("authSuccess"),
    logoutBtn: document.getElementById("logoutBtn"),
    authSection: document.getElementById("authSection"),
    blogSection: document.getElementById("blogSection"),
    newPostBtn: document.getElementById("newPostBtn"),
    postForm: document.getElementById("postForm"),
    formTitle: document.getElementById("formTitle"),
    postTitle: document.getElementById("postTitle"),
    savePostBtn: document.getElementById("savePostBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
    postError: document.getElementById("postError"),
    postsFeed: document.getElementById("postsFeed"),
    searchBar: document.getElementById("searchBar"),
  };

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  els.togglePass.onclick = () => {
    const type = els.password.type === "password" ? "text" : "password";
    els.password.type = type;
    els.togglePass.innerText = type === "password" ? "👁️" : "🙈";
  };
  els.themeBtn.onclick = () => {
    document.body.dataset.theme =
      document.body.dataset.theme === "dark" ? "" : "dark";
    els.themeBtn.innerText =
      document.body.dataset.theme === "dark" ? "☀️" : "🌙";
  };
  els.postDesc.oninput = () =>
    (els.charCount.innerText = els.postDesc.value.length);

  els.toggleAuth.onclick = (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    els.authTitle.innerText = isLogin ? "Login" : "Sign Up";
    els.authBtn.innerText = isLogin ? "Login" : "Sign Up";
    els.username.classList.toggle("hidden");
    els.toggleAuth.innerText = isLogin ? "Sign Up" : "Login";
  };

  // FIXED: NOW ALSO SAVE USER TO FIRESTORE "users" COLLECTION
  els.authBtn.onclick = async () => {
    const emailVal = els.email.value.trim(),
      passVal = els.password.value.trim(),
      nameVal = els.username.value.trim();
    if (!emailVal || !passVal || (!isLogin && !nameVal))
      return Swal.fire("Error", "All fields are required", "error");

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, emailVal, passVal);
        Toast.fire({ icon: "success", title: "Login successful!" });
      } else {
        const res = await createUserWithEmailAndPassword(
          auth,
          emailVal,
          passVal,
        );
        await updateProfile(res.user, { displayName: nameVal });

        // NEW: Save user info to Firestore so you can see it
        await setDoc(doc(db, "users", res.user.uid), {
          username: nameVal,
          email: emailVal,
          createdAt: serverTimestamp(),
        });

        Toast.fire({ icon: "success", title: "Account created successfully!" });
      }
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    }
  };

  els.logoutBtn.onclick = () => signOut(auth);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      els.authSection.classList.add("hidden");
      els.blogSection.classList.remove("hidden");
      els.logoutBtn.classList.remove("hidden");
      loadPosts();
    } else {
      els.authSection.classList.remove("hidden");
      els.blogSection.classList.add("hidden");
      els.logoutBtn.classList.add("hidden");
    }
  });

  els.newPostBtn.onclick = () => {
    els.postForm.classList.remove("hidden");
    els.formTitle.innerText = "Create Post";
    editingPostId = null;
    els.postTitle.value = "";
    els.postDesc.value = "";
  };
  els.cancelBtn.onclick = () => {
    els.postForm.classList.add("hidden");
  };

  els.savePostBtn.onclick = async () => {
    if (!els.postTitle.value.trim() || !els.postDesc.value.trim())
      return Swal.fire("Error", "Title and Description required", "error");
    const postData = {
      title: els.postTitle.value.trim(),
      description: els.postDesc.value.trim(),
      author: currentUser.displayName || currentUser.email.split("@")[0],
      uid: currentUser.uid,
      createdAt: serverTimestamp(),
    };
    try {
      if (editingPostId) {
        await updateDoc(doc(db, "posts", editingPostId), postData);
        Toast.fire({ icon: "success", title: "Post updated!" });
      } else {
        await addDoc(collection(db, "posts"), postData);
        Toast.fire({ icon: "success", title: "Post created!" });
      }
      els.postForm.classList.add("hidden");
      loadPosts();
    } catch (e) {
      Swal.fire("Error", "Error saving post: " + e.message, "error");
    }
  };

  async function loadPosts() {
    els.postsFeed.innerHTML = "Loading posts...";
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    allPosts = [];
    snap.forEach((d) => allPosts.push({ id: d.id, ...d.data() }));
    renderPosts(allPosts);
  }

  function renderPosts(posts) {
    els.postsFeed.innerHTML = "";
    if (posts.length === 0)
      return (els.postsFeed.innerHTML = "<p>No posts yet. Create one!</p>");
    posts.forEach((p) => {
      const date = p.createdAt
        ? new Date(p.createdAt.seconds * 1000).toLocaleString()
        : "Just now";
      const isOwner = p.uid === currentUser.uid;
      els.postsFeed.innerHTML += `<div class="card"><h3>${p.title}</h3><p>${p.description}</p><div class="post-meta">👤 ${p.author} | 🕐 ${date}</div>${isOwner ? `<div class="actions"><button class="btn" onclick="editPost('${p.id}')">Edit</button><button class="btn btn-danger" onclick="deletePost('${p.id}')">Delete</button></div>` : ""}</div>`;
    });
  }

  els.searchBar.oninput = () => {
    const searchTerm = els.searchBar.value.toLowerCase();
    const filtered = allPosts.filter((p) =>
      p.title.toLowerCase().includes(searchTerm),
    );
    renderPosts(filtered);
  };
  window.editPost = (id) => {
    const post = allPosts.find((p) => p.id === id);
    editingPostId = id;
    els.postTitle.value = post.title;
    els.postDesc.value = post.description;
    els.formTitle.innerText = "Edit Post";
    els.postForm.classList.remove("hidden");
  };

  window.deletePost = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff6b6b",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      await deleteDoc(doc(db, "posts", id));
      Toast.fire({ icon: "success", title: "Post deleted!" });
      loadPosts();
    }
  };
});
