import { useState } from "react";
import API from "./api";

function App() {
  const [page, setPage] = useState("auth");
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    skillsOffered: "",
    skillsWanted: "",
  });

  const [matches, setMatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState("");

  const getReceivedRequests = async () => {
    try {
      const response = await API.get("/swap-requests/received");

      console.log("RECEIVED REQUESTS:", response.data);

      setRequests(response.data.requests || []);

      setPage("requests");
    } catch (error) {
      console.error(
        "Get received requests error:",
        error.response?.data || error,
      );

      alert(error.response?.data?.message || "Failed to load swap requests");
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      const response = await API.put(`/swap-requests/${requestId}`, {
        status,
      });

      console.log("REQUEST STATUS:", response.data);

      alert(response.data.message);

      // Updated requests dobara load karenge
      await getReceivedRequests();
    } catch (error) {
      console.error("Update request error:", error.response?.data || error);

      alert(error.response?.data?.message || "Failed to update request");
    }
  };

  const getMyChats = async () => {
    try {
      const response = await API.get("/chats");

      console.log("MY CHATS:", response.data);

      setChats(response.data.chats || []);
    } catch (error) {
      console.error("Get chats error:", error.response?.data || error);

      alert(error.response?.data?.message || "Failed to load chats");
    }
  };

  const startChat = async (user) => {
    try {
      const response = await API.post("/chats", {
        receiverId: user._id,
      });

      console.log("CHAT CREATED:", response.data);

      const chat = response.data.chat;

      setSelectedChat(chat);

      const messageResponse = await API.get(`/messages/${chat._id}`);

      setMessages(messageResponse.data.messages || []);

      setPage("chat");
    } catch (error) {
      console.error("Start chat error:", error.response?.data || error);

      alert(error.response?.data?.message || "Failed to start chat");
    }
  };

  const openChat = async (chat) => {
    try {
      const response = await API.get(`/messages/${chat._id}`);

      console.log("CHAT MESSAGES:", response.data);

      setSelectedChat(chat);
      setMessages(response.data.messages || []);
      setPage("chat");
    } catch (error) {
      console.error("Open chat error:", error.response?.data || error);

      alert(error.response?.data?.message || "Failed to open chat");
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) {
      return;
    }

    if (!selectedChat) {
      return;
    }

    try {
      const response = await API.post("/messages", {
        chatId: selectedChat._id,
        text: messageText,
      });

      console.log("SENT MESSAGE:", response.data);

      setMessages((prevMessages) => [...prevMessages, response.data.data]);

      setMessageText("");
    } catch (error) {
      console.error("Send message error:", error.response?.data || error);

      alert(error.response?.data?.message || "Failed to send message");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = isLogin ? "/auth/login" : "/auth/register";

      const response = await API.post(url, formData);

      console.log(response.data);

      alert(response.data.message);

      if (isLogin && response.data.token) {
        localStorage.setItem("token", response.data.token);

        // Login ke baad profile page
        setPage("profile");
      }
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  const updateProfile = async () => {
    try {
      const response = await API.put("/users/profile", {
        name: profileData.name,
        bio: profileData.bio,

        skillsOffered: profileData.skillsOffered
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),

        skillsWanted: profileData.skillsWanted
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      });

      console.log("UPDATED PROFILE:", response.data);

      alert(response.data.message);

      // Profile save hone ke baad matches check karo
      const matchResponse = await API.get("/skills/matches");

      console.log("MATCHES:", matchResponse.data);

      setMatches(matchResponse.data.matches || []);

      // Match page par jao
      setPage("matches");

      if (matchResponse.data.matches.length === 0) {
        alert("Profile saved, but no skill match found.");
      }
    } catch (error) {
      console.error("Update profile error:", error.response?.data || error);

      alert(error.response?.data?.message || "Profile update failed");
    }
  };

  const findMatches = async () => {
    try {
      const response = await API.get("/skills/matches");

      console.log("MATCHES:", response.data);

      setMatches(response.data.matches || []);

      setPage("matches");

      if (response.data.matches.length === 0) {
        alert("No skill matches found");
      }
    } catch (error) {
      console.error("Find matches error:", error.response?.data || error);
    }
  };

  const sendSwapRequest = async (user) => {
    try {
      const myOfferedSkills = profileData.skillsOffered
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const myWantedSkills = profileData.skillsWanted
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const skillOffered = myOfferedSkills.find((mySkill) =>
        user.skillsWanted?.some(
          (wantedSkill) => wantedSkill.toLowerCase() === mySkill.toLowerCase(),
        ),
      );

      const skillWanted = myWantedSkills.find((mySkill) =>
        user.skillsOffered?.some(
          (offeredSkill) =>
            offeredSkill.toLowerCase() === mySkill.toLowerCase(),
        ),
      );

      if (!skillOffered || !skillWanted) {
        alert("Matching skills not found.");
        return;
      }

      const response = await API.post("/swap-requests", {
        receiverId: user._id,
        skillOffered,
        skillWanted,
      });

      console.log("SWAP REQUEST:", response.data);

      alert(response.data.message);
    } catch (error) {
      console.error("Send swap request error:", error.response?.data || error);

      alert(error.response?.data?.message || "Failed to send swap request");
    }
  };

  if (page === "profile") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-green-600">
            Skill Details
          </h1>

          <p className="text-center text-gray-500 mt-2">
            Add your skills to find a match
          </p>

          <div className="mt-6 space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={profileData.name}
              onChange={handleProfileChange}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />

            <textarea
              name="bio"
              placeholder="Write your bio"
              value={profileData.bio}
              onChange={handleProfileChange}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />

            <input
              type="text"
              name="skillsOffered"
              placeholder="Skills you can teach: React, Node.js"
              value={profileData.skillsOffered}
              onChange={handleProfileChange}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />

            <input
              type="text"
              name="skillsWanted"
              placeholder="Skills you want to learn: MongoDB, Python"
              value={profileData.skillsWanted}
              onChange={handleProfileChange}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />

            <button
              onClick={updateProfile}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              Save Skills
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (page === "chats") {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-green-600 text-center">
            My Chats
          </h1>

          <p className="text-center text-gray-500 mt-2">
            Select a person to start chatting
          </p>

          {chats.length === 0 ? (
            <div className="mt-8 bg-white rounded-2xl shadow p-8 text-center">
              <p className="text-gray-600">No chats available.</p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {chats.map((chat) => (
                <div
                  key={chat._id}
                  className="bg-white rounded-2xl shadow p-5 flex items-center justify-between"
                >
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      {chat.participants?.map((user) => user.name).join(" & ")}
                    </h2>

                    <p className="text-gray-500 text-sm mt-1">
                      Chat with your SkillSwap partner
                    </p>
                  </div>

                  <button
                    onClick={() => openChat(chat)}
                    className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Open Chat
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setPage("matches")}
            className="mt-8 block mx-auto text-green-600 font-semibold hover:underline"
          >
            ← Back to Matches
          </button>
        </div>
      </div>
    );
  }

  if (page === "chat") {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {/* Chat Header */}
            <div className="bg-green-600 text-white p-5">
              <h1 className="text-xl font-bold">
                {selectedChat?.participants
                  ?.map((user) => user.name)
                  .join(" & ")}
              </h1>

              <p className="text-green-100 text-sm mt-1">SkillSwap Chat</p>
            </div>

            {/* Messages */}
            <div className="h-[450px] overflow-y-auto p-5 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((message) => (
                  <div key={message._id} className="bg-gray-100 rounded-lg p-3">
                    <p className="font-semibold text-green-600">
                      {message.sender?.name}
                    </p>

                    <p className="text-gray-700 mt-1">{message.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Send Message */}
            <div className="border-t p-4 flex gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                className="flex-1 border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              />

              <button
                onClick={sendMessage}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                Send
              </button>
            </div>
          </div>

          <button
            onClick={() => setPage("matches")}
            className="mt-6 block mx-auto text-green-600 font-semibold hover:underline"
          >
            ← Back to Matches
          </button>
        </div>
      </div>
    );
  }

  if (page === "requests") {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-green-600 text-center">
            Swap Requests
          </h1>

          <p className="text-center text-gray-500 mt-2">
            Requests received from other users
          </p>

          {requests.length === 0 ? (
            <div className="mt-8 bg-white rounded-2xl shadow p-8 text-center">
              <p className="text-gray-600">No swap requests received.</p>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="bg-white rounded-2xl shadow p-6"
                >
                  <h2 className="text-xl font-bold text-green-600">
                    {request.sender?.name}
                  </h2>

                  <p className="text-gray-600 mt-2">
                    Email: {request.sender?.email}
                  </p>

                  <div className="mt-4">
                    <p className="font-semibold">They offer:</p>

                    <p className="text-gray-600">{request.skillOffered}</p>
                  </div>

                  <div className="mt-3">
                    <p className="font-semibold">They want:</p>

                    <p className="text-gray-600">{request.skillWanted}</p>
                  </div>

                  <div className="mt-4">
                    <p className="font-semibold">Status:</p>

                    <p className="text-gray-600 capitalize">{request.status}</p>
                  </div>

                  {request.status === "pending" && (
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() =>
                          updateRequestStatus(request._id, "accepted")
                        }
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                      >
                        Accept
                      </button>

                      <button
                        onClick={() =>
                          updateRequestStatus(request._id, "rejected")
                        }
                        className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setPage("matches")}
            className="mt-8 block mx-auto text-green-600 font-semibold hover:underline"
          >
            ← Back to Matches
          </button>
        </div>
      </div>
    );
  }

  if (page === "matches") {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-green-600 text-center">
            Skill Matches
          </h1>

          <p className="text-center text-gray-500 mt-2">
            People who can help you learn and learn from you
          </p>

          {matches.length === 0 ? (
            <div className="mt-8 bg-white rounded-2xl shadow p-8 text-center">
              <p className="text-gray-600">No matching users found.</p>

              <button
                onClick={() => setPage("profile")}
                className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg"
              >
                Update Skills
              </button>
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap justify-center gap-6">
              {matches.map((user) => (
                <div
                  key={user._id}
                  className="bg-white rounded-2xl shadow p-6 w-full md:w-[420px]"
                >
                  <h2 className="text-xl font-bold text-green-600">
                    {user.name}
                  </h2>

                  <p className="text-gray-600 mt-2">
                    {user.bio || "No bio available"}
                  </p>

                  <div className="mt-4">
                    <p className="font-semibold">Skills Offered:</p>

                    <p className="text-gray-600">
                      {user.skillsOffered?.join(", ") || "No skills added"}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="font-semibold">Skills Wanted:</p>

                    <p className="text-gray-600">
                      {user.skillsWanted?.join(", ") || "No skills added"}
                    </p>
                  </div>

                  <button
                    onClick={() => sendSwapRequest(user)}
                    className="mt-5 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Send Swap Request
                  </button>

                  <button
                    onClick={() => startChat(user)}
                    className="mt-3 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Start Chat
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={getReceivedRequests}
            className="mt-6 block mx-auto bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            View Swap Requests
          </button>

          <button
            onClick={async () => {
              await getMyChats();
              setPage("chats");
            }}
            className="mt-4 block mx-auto bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            My Chats
          </button>

          <button
            onClick={() => setPage("profile")}
            className="mt-8 block mx-auto text-green-600 font-semibold hover:underline"
          >
            ← Back to Skill Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-green-600">
          SkillSwap
        </h1>

        <p className="text-center text-gray-500 mt-2">
          {isLogin ? "Login to your account" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="text-center mt-5 text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-green-600 font-semibold hover:underline"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default App;
