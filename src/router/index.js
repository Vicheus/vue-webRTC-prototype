import Vue from 'vue';
import Router from 'vue-router';
import Prototype from '@/components/Prototype';
import Son from '@/components/Son';
import Father from '@/components/Father';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Prototype',
      component: Prototype,
    },
    {
      path: '/son',
      name: 'Son',
      component: Son,
    },
    {
      path: '/father',
      name: 'Father',
      component: Father,
    },

  ],
});
