import { gql } from "@apollo/client";

// ── Feed query (used by RSC page.tsx for SSR) ─────────────────────────────────
export const GET_FEED = gql`
  query GetFeed($cursor: String, $limit: Int) {
    feed(cursor: $cursor, limit: $limit) {
      id
      title
      body
      content
      score
      upvotes
      downvotes
      commentCount
      linkUrl
      imageUrl
      tags
      createdAt
      author {
        id
        username
        profilePic
        avatar
      }
    }
  }
`;

// ── Thread query (used by Client Component for nested comment tree) ───────────
export const GET_THREAD = gql`
  query GetThread($postId: ID!) {
    thread(postId: $postId) {
      id
      title
      body
      content
      score
      upvotes
      downvotes
      commentCount
      linkUrl
      imageUrl
      tags
      createdAt
      author {
        id
        username
        profilePic
        avatar
      }
      comments {
        id
        postId
        parentId
        path
        depth
        body
        content
        score
        upvotes
        downvotes
        isDeleted
        createdAt
        author {
          id
          username
          profilePic
          avatar
        }
        replies {
          id
          postId
          parentId
          path
          depth
          body
          content
          score
          upvotes
          downvotes
          isDeleted
          createdAt
          author {
            id
            username
            profilePic
            avatar
          }
          replies {
            id
            postId
            parentId
            path
            depth
            body
            content
            score
            upvotes
            downvotes
            isDeleted
            createdAt
            author {
              id
              username
              profilePic
              avatar
            }
            replies {
              id
              postId
              parentId
              path
              depth
              body
              content
              score
              upvotes
              downvotes
              isDeleted
              createdAt
              author {
                id
                username
                profilePic
                avatar
              }
            }
          }
        }
      }
    }
  }
`;

// ── User profile query ────────────────────────────────────────────────────────
export const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID, $username: String) {
    userProfile(id: $id, username: $username) {
      id
      username
      profilePic
      avatar
      bio
      createdAt
    }
  }
`;

// ── Me query (authenticated current user) ─────────────────────────────────────
export const GET_ME = gql`
  query Me {
    me {
      id
      username
      profilePic
      avatar
      bio
      createdAt
    }
  }
`;
