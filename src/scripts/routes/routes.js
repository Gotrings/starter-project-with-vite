import DetailStoryPage from '../pages/detail-story.js';

const routes = {
  '/': 'home',
  '/home': 'home',
  '/login': 'login',
  '/register': 'register',
  '/stories': 'stories',
  '/detail': new DetailStoryPage(),
  '/saved-reports': 'saved-reports',
  '/add-story': 'add-story',
  '/add-story-guest': 'add-story-guest'
};

export default routes;
