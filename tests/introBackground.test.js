const fs=require('node:fs');
const vm=require('node:vm');
const main=fs.readFileSync(require.resolve('../js/main'),'utf8');
const source=main.slice(main.indexOf('function handleClickOutside(event)'),main.indexOf('function isMissionControlCreditsMenuActive()'));
test.each([true,false])('intro modal open=%s prevents background sidebar dismissal only while open', open=>{
 const toggleMobileMenu=jest.fn();
 const context={document:{body:{classList:{contains:()=>open}}},isCompactLayoutViewport:()=>true,
  mobileMenuToggle:{contains:()=>false},appSidebar:{contains:()=>false,classList:{contains:()=>true}},
  canvasViewport:{contains:()=>false},toggleMobileMenu};
 vm.createContext(context);vm.runInContext(`${source}\nhandleClickOutside({pointerType:'mouse',target:{}});`,context);
 expect(toggleMobileMenu).toHaveBeenCalledTimes(open?0:1);
});
