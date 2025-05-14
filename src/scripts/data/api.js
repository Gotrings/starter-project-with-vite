import CONFIG from '../config';

const ENDPOINTS = {
  ENDPOINT: `${CONFIG.BASE_URL}/your/endpoint/here`,
  SAVED_REPORTS: `${CONFIG.BASE_URL}/users/saved-reports`,
  STORY_COMMENTS: (storyId) => `${CONFIG.BASE_URL}/stories/${storyId}/comments`,
};

function getToken() {
  return localStorage.getItem('token');
}

export async function getData() {
  const fetchResponse = await fetch(ENDPOINTS.ENDPOINT);
  if (!fetchResponse.ok) throw new Error('Failed to fetch data: ' + fetchResponse.status);
  return await fetchResponse.json();
}

export async function getUserSavedReports() {
  const token = getToken();
  const res = await fetch(ENDPOINTS.SAVED_REPORTS, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch saved reports: ' + res.status);
  return res.json();
}

export async function addUserSavedReport(story) {
  const token = getToken();
  const res = await fetch(ENDPOINTS.SAVED_REPORTS, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(story),
  });
  if (!res.ok) throw new Error('Failed to save report: ' + res.status);
  return res.json();
}

export async function deleteUserSavedReport(id) {
  const token = getToken();
  const res = await fetch(`${ENDPOINTS.SAVED_REPORTS}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete report: ' + res.status);
  return res.json();
}

export async function getStoryComments(storyId) {
  const token = getToken();
  const res = await fetch(ENDPOINTS.STORY_COMMENTS(storyId), {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch comments: ' + res.status);
  return res.json();
}

export async function addStoryComment(storyId, user, message) {
  const token = getToken();
  const res = await fetch(ENDPOINTS.STORY_COMMENTS(storyId), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user, message }),
  });
  if (!res.ok) throw new Error('Failed to add comment: ' + res.status);
  return res.json();
}

export async function deleteStoryComment(storyId, commentId) {
  const token = getToken();
  const res = await fetch(`${ENDPOINTS.STORY_COMMENTS(storyId)}/${commentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete comment: ' + res.status);
  return res.json();
}