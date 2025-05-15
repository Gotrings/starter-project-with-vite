import HomePage from '../pages/home/home-page.js';
import DetailStoryPage from '../pages/detail-story.js';
import AddStoryPage from '../pages/add-story.js';
import SavedReportsPage from '../pages/saved-reports.js';

const routes = {
  '/': HomePage,
  '/home': HomePage,
  '/stories/:id': DetailStoryPage,
  '/add-story': AddStoryPage,
  '/saved-reports': SavedReportsPage,
};

export default routes;
