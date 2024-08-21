// import JSON files

const prompts = require("./prompts.json");
const users = require("./users.json");

// creating class
class Prompts {
  constructor(prompts, users) {
    this.prompts = prompts;
    this.users = users;
  }

  //  method for find a user by username
  getUserByUsername(username) {
    return this.users.find((user) => user.username === username);
  }

  // method to check if a user can access a prompt
  canAccessPrompt(username, prompt) {
    const user = this.getUserByUsername(username);
    if (!user) return false;

    // access is allowed public-create by user,shared wit usr
    if (prompt.visibility === "public") return true;
    if (prompt.actor.username === username) return true;
    if (
      prompt.visibility === "custom" &&
      prompt.sharedAccess.includes(username)
    )
      return true;
  }

  // this for creation
  create(username, promptData) {
    const user = this.getUserByUsername(username);
    if (!user) throw new Error("User not found");
    const newPrompt = {
      _id: { $oid: `${new Date().getTime()}` },
      ...promptData,
      actor: { username },
      sharedAccess: promptData.visibility === "custom" ? [] : undefined,
      __v: 0,
    };
    this.prompts.push(newPrompt);
    return newPrompt;
  }

  // this for updation
  update(username, promptId, updatedData) {
    const prompt = this.prompts.find((p) => p._id.$oid === promptId);
    if (!prompt) throw new Error("prompt not found");
    if (prompt.actor.username !== username) throw new Error("Unauthoeized");

    Object.assign(prompt, updatedData);
    return prompt;
  }

  // retrive with specific Id
  get(username, promptId) {
    const prompt = this.prompts.find((p) => p._id.$oid === promptId);
    if (!prompt) throw new Error("prompt not found");
    if (!this.canAccessPrompt(username, prompt))
      throw new Error("Unauthorized");
    return prompt;
  }

  //  retrieve all
  getAll(username) {
    return this.prompts.filter((prompt) =>
      this.canAccessPrompt(username, prompt)
    );
  }

  // delete a prompt by ID
  delete(username, promptId) {
    const promptIndex = this.prompts.findIndex((p) => p._id.$oid === promptId);
    if (promptIndex === -1) throw new Error("Prompt not found");

    const prompt = this.prompts[promptIndex];
    if (prompt.actor.username != username) throw new Error("Unauthorized");
    this.prompts.splice(promptIndex, 1);
    return prompt;
  }

  //  to share a custom prompt with another user
  sharedAccess(username, promptId, shareWith) {
    const prompt = this.prompts.find((p) => p._id.$oid === promptId);
    if (!prompt) throw new Error("prompt not found");
    if (prompt.actor.username !== username) throw new Error("Unauthorized");
    if (prompt.visibility !== "custom") throw new Error("Invalid opertion");

    if (!prompt.sharedAccess.includes(shareWith)) {
      prompt.sharedAccess.push(shareWith);
    }
    return prompt;
  }
}

//  exmaple

const promptManager = new Prompts(prompts, users);

// Create a new prompt
const newPrompt = promptManager.create("sarahwilson", {
  prompt: "new promapt for testing",
  label: "New Label",
  visibility: "custom",
  description: "This is a new prompt",
});
console.log("created prompt :", newPrompt);

// get all prompt for a user

const allPrompts = promptManager.getAll("sarahwilson");
console.log("all Accessible Prompts", allPrompts);

// update a prompt
const updatePrompt = promptManager.update("sarahwilson", newPrompt._id.$oid, {
  label: "updated label",
});
console.log("updated prompt:", updatePrompt);

// Delete a prompt

const deletedPrompt = promptManager.delete("sarahwilson", newPrompt._id.$oid);
console.log("Deleted prompt:", deletedPrompt);

// share a prompt with another user

const sharedPrompt = promptManager.sharedAccess(
  "sarahwilson",
  newPrompt._id.$oid,
  "johndoe"
);

console.log("Shared Prompt:", sharedPrompt);
