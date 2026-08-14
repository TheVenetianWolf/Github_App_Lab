export default (app) => {
  app.on("pull_request.opened", async (context) => {
    const pr = context.payload.pull_request;
    const fileCount = pr.changed_files;
    const linesAdded = pr.additions;

    let reviewMessage = `### 🤖 Beep Boop: Automated PR Analysis\n`;
    reviewMessage += `I see you changed **${fileCount} files** and added **${linesAdded} lines** of code.\n\n`;

    if (linesAdded > 300) {
      reviewMessage +=
        "⚠️ **Warning:** This is a massive PR! Consider breaking it down into smaller pieces so humans can review it easier.";
    } else {
      reviewMessage +=
        "✅ **Great job!** This is a nice, bite-sized PR. It should be easy for the team to review.";
    }

    const reviewPayload = context.repo({
      pull_number: pr.number,
      body: reviewMessage,
      event: "COMMENT",
    });

    // Probot 14 mounts REST under octokit.rest (not octokit.pulls)
    return context.octokit.rest.pulls.createReview(reviewPayload);
  });
};
