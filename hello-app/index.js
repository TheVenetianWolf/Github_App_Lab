export default (app) => {
  // 1. The Ear: Listening for a specific event
  app.on("issues.opened", async (context) => {
    
    // 2. The Brain: Formulating the response
    const message = context.issue({
      body: "Hello! :wave: Thanks for opening this issue. A human will take a look shortly.",
    });

    // 3. The Megaphone: Shouting back to GitHub
    return context.octokit.issues.createComment(message);
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};