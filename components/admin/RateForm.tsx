import {saveRate} from '@/app/admin/actions'
import {todayInIndia} from '@/lib/dates'
export default function RateForm({rate}:{rate?:{id:string;effective_date:string;rate_per_gram:number}}){
 return <form action={saveRate} className="admin-form form">
  {rate&&<input type="hidden" name="id" value={rate.id}/>}
  <div className="form-grid">
   <div className="field"><label htmlFor="rate-date">Effective date (India)</label><input id="rate-date" required type="date" name="effective_date" className="input" defaultValue={rate?.effective_date||todayInIndia()}/></div>
   <div className="field"><label htmlFor="rate-value">Rate per gram (₹)</label><input id="rate-value" required type="number" step=".01" min="0.01" max="1000000" name="rate_per_gram" className="input" defaultValue={rate?.rate_per_gram||''}/></div>
  </div><button className="btn btn-dark">Save rate</button>
 </form>
}
