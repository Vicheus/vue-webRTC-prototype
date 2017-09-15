import Vue from 'vue';
import Router from 'vue-router';
import Prototype from '@/components/Prototype';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Prototype',
      component: Prototype,
    },
  ],
});
