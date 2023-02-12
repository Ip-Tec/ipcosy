import Chat from "../pages/Chat.vue";
import Home from "../pages/Home.vue";
import Group from "../pages/Group.vue";
import Login from "../pages/auth/Login.vue";
import Register from "../pages/auth/Register.vue";
import PrivateMessage from "../pages/PrivateMessage.vue";

// Chat for privite message
// Group for public message
let Dashbord = "<template><h4>lorem4</h4></template>";
let MessageUser = "<template><h4>Message User</h4></template>";
let MessageGroupEvent = "<template><h4>MessageGroupEvent</h4></template>";

const routes = [
    {
        path: "/",
        name: "Home",
        component: Home,
        meta: { transition: "slide-right" },
    },
    {
        path: "/:pathMatch",
        name: "MessageUser",
        component: MessageUser,
        meta: { transition: "slide-right" },
        // Both you and the person who send you message see all message like a Group
    },
    {
        path: "/private/:username",
        name: "PrivateMessage",
        component: PrivateMessage,
        meta: { transition: "slide-left", username: ":username" },
        // only you and and the preson who send you message like a private chat (private Group chat)
    },
    {
        path: "/Dashbord",
        name: "Dashbord",
        component: Dashbord,
        meta: { transition: "slide-left" },
    },

    {
        path: "/auth/login",
        name: "Login",
        component: Login,
        meta: { transition: "slide-right" },
    },
    {
        path: "/auth/register",
        name: "Register",
        component: Register,
        meta: { transition: "slide-left" },
    },

    {
        path: "/auth/user/chat",
        name: "Chat",
        component: Chat,
        meta: { transition: "slide-right" },
    },
    {
        path: "/group/:groupName",
        name: "Group",
        component: Group,
        meta: { transition: "slide-left" },
    },
];

export default routes;
