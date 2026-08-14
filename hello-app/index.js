export default (app) => {
  app.on("issues.opened", async (context) => {
    const title = context.payload.issue.title;

    // Case-insensitive match so "Bug:" and "bug" both qualify
    if (!/\bbug\b/i.test(title)) {
      return;
    }

    return context.octokit.rest.issues.addLabels(
      context.issue({
        labels: ["bug"],
      }),
    );
  });
};
