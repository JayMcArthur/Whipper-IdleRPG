import { benchmarkDungeon } from './combat';

self.addEventListener('message',event => {
  try {
    const {build,plan,trials,seed,options}=event.data;
    self.postMessage({result:benchmarkDungeon(build,plan,trials,seed,options)});
  } catch(error) {self.postMessage({error:error instanceof Error ? error.message : 'Encounter test failed.'});}
});
