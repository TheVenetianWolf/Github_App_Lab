export default (app) => {
  // Listen for opened and reopened so closing/reopening a PR also triggers a review
  app.on(["pull_request.opened", "pull_request.reopened"], async (context) => {
    const pr = context.payload.pull_request;
    const fileCount = pr.changed_files;
    const linesAdded = pr.additions;

    let reviewMessage = `### A little look at this pull request\n\n`;
    reviewMessage += `Alright — let's see what we've got here. You touched **${fileCount} files** and added **${linesAdded} lines**. `;
    reviewMessage += `Numbers alone don't tell the whole story, but they do tell us something about how hard this will be to *understand*.\n\n`;

    if (linesAdded > 300) {
      reviewMessage +=
        `Now hold on. **${linesAdded} lines** in one gulp is a lot to keep in your head at once. ` +
        `If I can't explain what changed to someone else in a few minutes, I don't really understand it yet — ` +
        `and neither will your reviewers.\n\n` +
        `**Suggestion:** break this into smaller pieces. Each piece should be something you could draw on a napkin. ` +
        `Nature isn't complicated in big mysterious lumps; the trick is finding the simple parts. Same with code.`;
    } else {
      reviewMessage +=
        `This looks manageable — about the size where a curious person can actually follow the idea end to end. ` +
        `That's the good stuff. **Keep it bite-sized like this** and people can argue about the *physics* of the change, ` +
        `not drown in the paperwork.\n\n` +
        `Nice work. If you understand it well enough to make it this small, you're already ahead.`;
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
