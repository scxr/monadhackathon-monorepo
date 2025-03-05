
const assert = require("assert");
const { TestHelpers } = require("generated");
const { MockDb, ChainSocial } = TestHelpers;

describe("ChainSocial contract CommentAdded event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ChainSocial contract CommentAdded event
  const event = ChainSocial.CommentAdded.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ChainSocial_CommentAdded is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ChainSocial.CommentAdded.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualChainSocialCommentAdded = mockDbUpdated.entities.ChainSocial_CommentAdded.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedChainSocialCommentAdded = {
      id:`${event.chainId}_${event.block.number}_${event.logIndex}`,
      commentId: event.params.commentId,
      postId: event.params.postId,
      author: event.params.author,
      content: event.params.content,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualChainSocialCommentAdded,
      expectedChainSocialCommentAdded,
      "Actual ChainSocialCommentAdded should be the same as the expectedChainSocialCommentAdded"
    );
  });
});
