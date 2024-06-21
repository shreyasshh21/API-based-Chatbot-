const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const chatbox = document.querySelector(".chatbox");
const API_KEY = "https://api.openai.com/v1/chat/completions";  // Replace with your actual API key
let userMessage = null;
const chatbotToggler = document.querySelector(".chatbot-toggler");
const chatbotCloseBtn = document.querySelector(".close-btn");
const inputInitHeight = chatInput.scrollHeight;

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const generateResponse = async (incomingChatLi) => {
    const API_URL = "https://api.openai.com/v1/chat/completions";
    const messageElement = incomingChatLi.querySelector("p");
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: userMessage }]
        })
    }

    let retries = 3;
    while (retries > 0) {
        try {
            const response = await fetch(API_URL, requestOptions);
            if (!response.ok) {
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
                    console.warn(`Rate limit exceeded. Retrying after ${delayMs} ms...`);
                    await delay(delayMs);
                    retries--;
                    continue;
                } else {
                    throw new Error(response.statusText);
                }
            }
            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                messageElement.textContent = data.choices[0].message.content;
            } else {
                throw new Error(data.error.message);
            }
            break;
        } catch (error) {
            if (retries <= 0) {
                messageElement.classList.add("error");
                if (error.message.includes("exceeded your current quota")) {
                    messageElement.textContent = "You have exceeded your API quota. Please check your plan and billing details.";
                } else {
                    messageElement.textContent = "OOPS! Something went wrong. Please try again";
                }
                console.error("API response error:", error);
            }
        }
    }
    chatbox.scrollTo(0, chatbox.scrollHeight);
}

const handleChat = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;
    chatInput.value = "";
    chatbox.scrollTo(0, chatbox.scrollHeight);
    chatInput.style.height = `${inputInitHeight}px`;

    chatbox.appendChild(createChatLi(userMessage, "outgoing"));

    setTimeout(() => {
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        generateResponse(incomingChatLi);
    }, 600);
}

chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
chatbotCloseBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
