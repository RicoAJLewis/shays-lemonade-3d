const flavors=["lemon","strawberry","mango","coconut","mint"];
const labels={lemon:"Classic Lemonade",strawberry:"Strawberry Lemonade",mango:"Mango Lemonade",coconut:"Coconut Lemonade",mint:"Frosted Mint Lemonade"};
const prices={lemon:10,strawberry:15,mango:15,coconut:15,mint:15};
const descriptions={lemon:"Crisp, tart, and bursting with sun-drenched citrus, every ice-cold sip surges through to bring you pure, thirst-quenching refreshment.",strawberry:"Sweet, tart, and bursting with crushed, sun-ripened berries, every ice-cold sip delivers a rush of vibrant, berry-citrus bliss.",mango:"Juicy, vibrant, and bursting with lush tropical sweetness, every ice-cold sip blends golden fruit with a sharp citrus snap for pure sunshine in a cup.",coconut:"Silky, tangy, and infused with breezy island creaminess, every chilled sip balances tart citrus with smooth, tropical indulgence.",mint:"Crisp, zesty, and infused with freshly crushed garden mint, every frosty sip delivers an icy burst of botanical energy."};
const colors={lemon:"#d7a006",strawberry:"#9d174d",mango:"#eb7825",coconut:"#fff",mint:"#50b008"};
const whatsappNumber="12462612913";
const state={quantities:Object.fromEntries(flavors.map(flavor=>[flavor,0])),cart:{},activeFlavor:0,userScrolled:false};
const flow=document.querySelector("#verticalFlow");
const track=document.querySelector("#flavorTrack");
const opening=document.querySelector("#opening");
const openingPage=document.querySelector("#opening-page");
const checkout=document.querySelector("#checkout");
const homeLogo=document.querySelector(".home-logo");
const flavorSlides=[...document.querySelectorAll(".flavor-slide")];
let introFinished=false;
let flavorScrollTimer;
let flavorButtonNavigation=false;
let lastFlavorMotionIndex=-1;
let lastFlavorMotionStartedAt=0;

addEventListener("message",event=>{
  if(event.source===homeLogo?.contentWindow&&event.data?.type==="shay-logo-ready")document.querySelector(".home-stage")?.classList.add("logo-ready");
  if(event.source===homeLogo?.contentWindow&&event.data?.type==="shay-logo-interacted")document.querySelector(".home-stage")?.classList.add("logo-interacted");
});

function startAnimatedFavicon(){
  const link=document.querySelector("#siteFavicon");
  const image=new Image();
  image.src="assets/favicon-logo.png";
  image.addEventListener("load",()=>{
    const canvas=document.createElement("canvas");canvas.width=64;canvas.height=64;
    const context=canvas.getContext("2d");let angle=0;
    const draw=()=>{angle=(angle+.045)%(Math.PI*2);const scale=Math.cos(angle);context.clearRect(0,0,64,64);context.save();context.translate(32,32);context.scale(1,scale);context.drawImage(image,-30,-30,60,60);context.restore();link.href=canvas.toDataURL("image/png");requestAnimationFrame(draw);};
    draw();
  });
}

function startLocationMap(){
  const element=document.querySelector("#locationMap");if(!element||!window.L)return;
  const business=[13.242985,-59.629323];element.replaceChildren();
  const map=L.map(element,{scrollWheelZoom:true}).setView(business,17);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  const markerSize=Math.round(Math.max(46,Math.min(68,element.getBoundingClientRect().width*.065)));
  const pin=L.icon({iconUrl:"assets/map-pin.png",iconSize:[markerSize,Math.round(markerSize*1.18)],iconAnchor:[markerSize/2,Math.round(markerSize*1.18)],popupAnchor:[0,-Math.round(markerSize*1.05)],className:"shay-map-pin"});
  L.marker(business,{icon:pin,title:"Shay's Lemonade Bar",alt:"Shay's Lemonade Bar location"}).addTo(map).bindPopup("<strong>Shay's Lemonade Bar</strong><br>Haymans Market").openPopup();
  addEventListener("resize",()=>map.invalidateSize(),{passive:true});
}

function replayFlavorMotion(index){
  const stage=flavorSlides[index]?.querySelector(".flavor-stage");
  if(!stage)return;
  const now=performance.now();
  if(index===lastFlavorMotionIndex&&now-lastFlavorMotionStartedAt<700)return;
  lastFlavorMotionIndex=index;
  lastFlavorMotionStartedAt=now;
  flavorSlides.forEach(slide=>slide.querySelector(".flavor-stage")?.classList.remove("is-flavor-active"));
  void stage.offsetWidth;
  stage.classList.add("is-flavor-active");
  const video=stage.querySelector(".flavor-motion");
  flavorSlides.forEach(slide=>{const other=slide.querySelector(".flavor-motion");if(other&&other!==video)other.pause();});
  if(!video||matchMedia("(prefers-reduced-motion: reduce)").matches||matchMedia("(min-width:901px) and (min-height:601px)").matches)return;
  video.pause();video.currentTime=0;video.play().catch(()=>{});
}

function goTo(id){document.querySelector(`#${id}`).scrollIntoView({behavior:"smooth",block:"start"});if(id==="menu")track.scrollTo({left:0,behavior:"smooth"});}
function sendOrderToWhatsApp(){
  const items=Object.entries(state.cart).filter(([,quantity])=>quantity>0);
  if(!items.length){notify("Your cart is empty.");return;}
  const total=items.reduce((sum,[flavor,quantity])=>sum+prices[flavor]*quantity,0);
  const summary=items.map(([flavor,quantity])=>`• ${labels[flavor]} × ${quantity} — $${(prices[flavor]*quantity).toFixed(2)} BDS`).join("\n");
  const message=`Thank you for shopping with Shay's Lemonade Bar!\n\nOrder summary:\n${summary}\n\nTotal: $${total.toFixed(2)} BDS`;
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer");
  state.cart={};flavors.forEach(flavor=>state.quantities[flavor]=0);
  document.querySelectorAll(".quantity-output").forEach(output=>output.value=0);
  renderCart();checkout.close();notify("Thank you! Your WhatsApp order summary is ready to send.");
}
function navMarkup(){return `<nav class="hotspots nav" aria-label="Page navigation"><button data-target="home" aria-label="Home"></button><button data-target="menu" aria-label="Menu"></button><button data-target="location" aria-label="Location"></button><button data-target="contact" aria-label="Contact"></button></nav><button class="hotspot cart-button" data-action="open-cart" aria-label="Open cart"><span class="cart-badge" aria-hidden="true" hidden>0</span></button>`;}
function menuMarkup(flavor,index){const title='<span class="script-word">Bajan&nbsp;&nbsp;</span>Classic<br>in Every <span class="script-word">Sip</span>';return `${navMarkup()}<div class="mobile-product-copy"><h2>${title}</h2><p>${descriptions[flavor]}</p></div><div class="mobile-purchase"><strong>$${prices[flavor]} BDS</strong><div class="quantity-row"><button class="quantity minus" data-action="minus" aria-label="Decrease quantity"></button><output class="quantity-output" style="--quantity-bg:${colors[flavor]}">${state.quantities[flavor]}</output><button class="quantity plus" data-action="plus" aria-label="Increase quantity"></button></div><button class="add-cart" data-action="add" data-flavor="${flavor}" aria-label="Add ${labels[flavor]} to cart"></button></div>${index?`<button class="arrow arrow-left${index===4?' solo':''}" data-action="previous" aria-label="Previous flavor"></button>`:""}${index<4?`<button class="arrow arrow-right${index===0?' solo':''}" data-action="next" aria-label="Next flavor"></button>`:""}`;}
document.querySelectorAll(".simple-page-hotspots").forEach(el=>el.innerHTML=navMarkup());
document.querySelectorAll(".flavor-slide").forEach((slide,index)=>slide.querySelector(".page-hotspots").innerHTML=menuMarkup(slide.dataset.flavor,index));
document.querySelectorAll(".cart-button:not(.mobile-cart)").forEach(button=>{
  button.insertAdjacentHTML("afterbegin",'<svg class="desktop-cart-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M8.5 11.5h15l1.8 14H6.7l1.8-14Z"/><path d="M11.5 12V9a4.5 4.5 0 0 1 9 0v3"/></svg>');
});
// Desktop artwork is composed from the original transparent assets, not from a
// 1440×1024 video/poster whose rectangular edges would show on wide displays.
document.querySelectorAll(".flavor-slide").forEach(slide=>{
  const flavor=slide.dataset.flavor;
  const word={lemon:"The Classic",strawberry:"Strawberry",mango:"Mango",coconut:"Coconut",mint:"Frosted Mint"}[flavor];
  const layer=document.createElement("div");layer.className="desktop-flavor-art";layer.setAttribute("aria-hidden","true");
  layer.innerHTML=`<img class="desktop-fruit" src="assets/mobile-${flavor === "lemon" ? "lemon" : flavor}-fruit.png" alt=""><span class="desktop-flavor-word">${word}</span><img class="desktop-cup" src="assets/mobile-${flavor === "lemon" ? "classic" : flavor}-cup.png" alt=""><div class="desktop-nav"><span>Home</span><span class="selected">Menu</span><span>Location</span><span>Contact</span></div><span class="desktop-bag" aria-hidden="true"></span><div class="desktop-copy"><h2><em>Bajan</em> Classic<br>In Every <em>Sip</em></h2><p>${descriptions[flavor]}</p></div><strong class="desktop-price">$${prices[flavor]}</strong><span class="desktop-minus">−</span><span class="desktop-plus">+</span><span class="desktop-add">Add To Cart</span><span class="desktop-arrow desktop-previous"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 3 7.5 12l9 9"/></svg></span><span class="desktop-arrow desktop-next"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 3 16.5 12l-9 9"/></svg></span>`;
  slide.querySelector(".flavor-stage").insertBefore(layer,slide.querySelector(".mini-logo"));
});

document.addEventListener("click",event=>{
  const target=event.target.closest("[data-target]");if(target){goTo(target.dataset.target);return;}
  const action=event.target.closest("[data-action]");if(!action)return;
  if(action.dataset.action==="open-cart"){renderCart();checkout.showModal();return;}
  if(action.dataset.action==="close-cart"){checkout.close();return;}
  if(action.dataset.action==="confirm-order"){sendOrderToWhatsApp();return;}
  const flavorSlide=action.closest(".flavor-slide");
  const selectedFlavor=flavorSlide?.dataset.flavor;
  if(action.dataset.action==="minus"&&selectedFlavor)state.quantities[selectedFlavor]=Math.max(0,state.quantities[selectedFlavor]-1);
  if(action.dataset.action==="plus"&&selectedFlavor)state.quantities[selectedFlavor]+=1;
  if(action.dataset.action==="previous")state.activeFlavor=Math.max(0,state.activeFlavor-1);
  if(action.dataset.action==="next")state.activeFlavor=Math.min(4,state.activeFlavor+1);
  if(action.dataset.action==="previous"||action.dataset.action==="next"){flavorButtonNavigation=true;track.scrollTo({left:state.activeFlavor*track.clientWidth,behavior:"smooth"});}
  if(action.dataset.action==="add"){
    const flavor=action.dataset.flavor;const quantity=state.quantities[flavor];
    if(quantity<1){notify("Choose a quantity first");return;}
    state.cart[flavor]=(state.cart[flavor]||0)+quantity;renderCart();notify(`${quantity} ${labels[flavor]} added to cart`);
  }
  if(selectedFlavor)flavorSlide.querySelector(".quantity-output").value=state.quantities[selectedFlavor];
});
checkout.addEventListener("click",event=>{if(event.target===checkout)checkout.close();});

track.addEventListener("scroll",()=>{
  const nextFlavor=Math.max(0,Math.min(flavorSlides.length-1,Math.round(track.scrollLeft/track.clientWidth)));
  state.activeFlavor=nextFlavor;
  clearTimeout(flavorScrollTimer);
  flavorScrollTimer=setTimeout(()=>{flavorButtonNavigation=false;if(!document.body.classList.contains("intro-active"))replayFlavorMotion(nextFlavor);},140);
},{passive:true});
track.addEventListener("wheel",event=>{if(Math.abs(event.deltaX)>Math.abs(event.deltaY))return;if(event.shiftKey){event.preventDefault();track.scrollBy({left:event.deltaY,behavior:"auto"});}},{passive:false});
flow.addEventListener("scroll",()=>{if(flow.scrollTop>20)state.userScrolled=true;},{passive:true});

function renderCart(){
  const items=Object.entries(state.cart);
  document.querySelector("#cartItems").innerHTML=items.length?items.map(([key,qty])=>`<div class="cart-row"><input class="cart-check" type="checkbox" checked aria-label="Select ${labels[key]}"><span class="cart-copy">${labels[key]}<small>$${prices[key]} BDS</small></span><span class="cart-qty">Qty: ${qty}</span><button class="cart-delete" data-remove="${key}" aria-label="Remove ${labels[key]}"><img src="assets/trash.svg" alt=""></button></div>`).join(""):"<p class=\"empty-cart\">Your cart is empty.</p>";
  document.querySelector("#total").textContent=`$${items.reduce((sum,[key,qty])=>sum+prices[key]*qty,0).toFixed(2)}`;
  const count=Object.values(state.cart).reduce((sum,qty)=>sum+qty,0);
  document.querySelectorAll(".cart-button").forEach(button=>{const badge=button.querySelector(".cart-badge");badge.textContent=count;badge.hidden=count===0;button.setAttribute("aria-label",`Open cart, ${count} item${count===1?"":"s"}`);});
}
document.addEventListener("click",event=>{const remove=event.target.closest("[data-remove]");if(remove){delete state.cart[remove.dataset.remove];renderCart();}});
document.querySelector("#contactForm").addEventListener("submit",event=>{event.preventDefault();const data=new FormData(event.currentTarget);const subject=encodeURIComponent("New Shay's Lemonade Bar website message");const body=encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\nPhone: ${data.get("phone")}\n\nMessage:\n${data.get("message")}`);window.location.href=`mailto:Sharajay76@gmail.com?subject=${subject}&body=${body}`;notify("Your email app is opening with the message ready to send.");});

let toastTimer;function notify(message){const toast=document.querySelector("#toast");toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2200);}
function replayOpening(){opening.classList.remove("playing");void opening.offsetWidth;opening.classList.add("playing");}
function setActiveNavigation(page){document.querySelectorAll("#mobileHeader [data-target]").forEach(button=>button.classList.toggle("is-active",button.dataset.target===page));}
const pageObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&!document.body.classList.contains("intro-active")){setActiveNavigation(entry.target.id);entry.target.querySelectorAll(".page-stage:not(.flavor-stage)").forEach(stage=>{stage.classList.remove("is-active");void stage.offsetWidth;stage.classList.add("is-active");});if(entry.target.id==="menu")replayFlavorMotion(state.activeFlavor);}}),{root:flow,threshold:.65});
document.querySelectorAll(".page-shell").forEach(page=>pageObserver.observe(page));
opening.addEventListener("animationend",event=>{
  if(event.animationName!=="openingWordOpacity"||introFinished)return;
  introFinished=true;
  const homeStage=document.querySelector(".home-stage");
  flow.scrollTop=0;
  homeStage.classList.remove("is-active");
  void homeStage.offsetWidth;
  homeStage.classList.add("is-active");
  document.body.classList.remove("intro-active");
  requestAnimationFrame(()=>requestAnimationFrame(()=>openingPage.classList.add("intro-exiting")));
  openingPage.addEventListener("transitionend",()=>document.body.classList.add("intro-complete"),{once:true});
});
renderCart();setActiveNavigation("home");startAnimatedFavicon();startLocationMap();replayOpening();
