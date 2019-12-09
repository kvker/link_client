import App from './App.svelte'

if(!(AV.applicationId && (AV.applicationKey || AV.masterKey))) {
  AV.init({
    appId: 'h7yi7AWU813r5FbiKqXWo7zC-9Nh9j0Va',
    appKey: 'HBMgkORRWCCgmdvkthe81pQ3',
    serverURLs: "https://h7yi7awu.lc-cn-e1-shared.com",
  })
}

const app = new App({
  target: document.body,
  props: {
    // name: 'world'
  }
})

export default app