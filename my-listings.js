const { createClient } = supabase;
const carivoDb=createClient(window.CARIVO_SUPABASE_URL,window.CARIVO_SUPABASE_ANON_KEY);
async function getCurrentUser(){const {data:{user}}=await carivoDb.auth.getUser();return user}
async function loadMyListings(){const user=await getCurrentUser();if(!user)return [];const {data,error}=await carivoDb.from('listings').select('*, listing_images(image_url,sort_order)').eq('seller_id',user.id).order('created_at',{ascending:false});if(error){console.error(error);return []}return data||[]}
async function createListing(listing){const user=await getCurrentUser();if(!user)throw new Error('برای ثبت آگهی ابتدا وارد شوید');const payload={...listing,seller_id:user.id};const {data,error}=await carivoDb.from('listings').insert(payload).select().single();if(error)throw error;return data}
async function deleteListing(id){const user=await getCurrentUser();if(!user)throw new Error('وارد حساب شوید');const {error}=await carivoDb.from('listings').delete().eq('id',id).eq('seller_id',user.id);if(error)throw error}
window.CarivoAccount={db:carivoDb,getCurrentUser,loadMyListings,createListing,deleteListing};