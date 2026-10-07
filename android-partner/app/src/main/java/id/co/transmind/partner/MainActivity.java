package id.co.transmind.partner;

import android.graphics.Color;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.widget.*;
import androidx.activity.ComponentActivity;
import org.json.*;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

public class MainActivity extends ComponentActivity {
  private static final String SUPABASE_URL = "https://ynigwuutmqpnfnkhlaip.supabase.co";
  private static final String SUPABASE_KEY = "sb_publishable_MycpkacWOWLwO2gXclp2Cw_ApWaeeAw";
  private final ExecutorService io = Executors.newSingleThreadExecutor();
  private String accessToken;
  private LinearLayout root, content;

  @Override public void onCreate(Bundle b) { super.onCreate(b); showLogin(); }

  private TextView tv(String text,int size){TextView v=new TextView(this);v.setText(text);v.setTextSize(size);v.setTextColor(Color.WHITE);v.setPadding(4,8,4,8);return v;}
  private Button btn(String text){Button b=new Button(this);b.setText(text);return b;}
  private EditText input(String hint,boolean password){EditText e=new EditText(this);e.setHint(hint);e.setTextColor(Color.WHITE);e.setHintTextColor(Color.GRAY);e.setSingleLine(true);e.setPadding(18,10,18,10);if(password)e.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);return e;}
  private void base(String heading){root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(22,24,22,20);root.setBackgroundColor(Color.rgb(7,9,13));TextView t=tv(heading,24);t.setTypeface(null,1);root.addView(t);content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);root.addView(content,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);}

  private void showLogin(){
    base("TRANSMIND PARTNER");content.setGravity(Gravity.CENTER_VERTICAL);
    content.addView(tv("Mini-office rental partner\nKelola supply, booking, availability, dan fulfillment.",15));
    EditText email=input("Email partner",false),pass=input("Password",true);content.addView(email);content.addView(pass);
    Button login=btn("MASUK KE PARTNER OFFICE");content.addView(login);TextView msg=tv("",13);content.addView(msg);
    login.setOnClickListener(v->{msg.setText("Mengautentikasi...");io.submit(()->{try{
      JSONObject body=new JSONObject().put("email",email.getText().toString().trim()).put("password",pass.getText().toString());
      JSONObject r=new JSONObject(request("/auth/v1/token?grant_type=password","POST",body.toString(),null));
      accessToken=r.optString("access_token",null);if(accessToken==null)throw new Exception(r.optString("msg",r.optString("error_description","Login gagal")));
      runOnUiThread(this::showDashboard);
    }catch(Exception e){runOnUiThread(()->msg.setText("Gagal: "+e.getMessage()));}});});
  }

  private void showDashboard(){
    base("Partner Office");content.addView(tv("Terhubung ke NEXUS • Partner session aktif",13));
    LinearLayout nav=new LinearLayout(this);nav.setOrientation(LinearLayout.HORIZONTAL);
    Button bookings=btn("BOOKING"),fleet=btn("SUPPLY"),refresh=btn("REFRESH"),logout=btn("KELUAR");
    nav.addView(bookings,new LinearLayout.LayoutParams(0,-2,1));nav.addView(fleet,new LinearLayout.LayoutParams(0,-2,1));nav.addView(refresh,new LinearLayout.LayoutParams(0,-2,1));nav.addView(logout,new LinearLayout.LayoutParams(0,-2,1));root.addView(nav,1);
    bookings.setOnClickListener(v->loadBookings());fleet.setOnClickListener(v->loadFleet());refresh.setOnClickListener(v->loadBookings());logout.setOnClickListener(v->{accessToken=null;showLogin();});loadBookings();
  }

  private void loadBookings(){content.removeAllViews();content.addView(tv("Antrian Booking Partner",19));content.addView(tv("Booking yang sudah dialokasikan ke partner ini.",12));io.submit(()->{try{
    JSONArray a=new JSONArray(request("/rest/v1/rpc/partner_booking_queue","POST","{}",accessToken));runOnUiThread(()->renderBookings(a));
  }catch(Exception e){runOnUiThread(()->content.addView(tv("Gagal memuat booking: "+e.getMessage(),13)));}});}

  private void renderBookings(JSONArray a){if(a.length()==0){content.addView(tv("Belum ada booking yang dialokasikan.",14));return;}for(int i=0;i<a.length();i++)try{
    JSONObject x=a.getJSONObject(i);LinearLayout card=new LinearLayout(this);card.setOrientation(LinearLayout.VERTICAL);card.setPadding(14,12,14,12);
    TextView t=tv(x.optString("booking_code")+" • "+x.optString("status"),16);t.setTypeface(null,1);card.addView(t);
    card.addView(tv(x.optString("customer_name")+" • "+x.optString("customer_phone")+"\n"+x.optString("service")+" • "+x.optString("area")+"\n"+x.optString("start_date")+" → "+x.optString("end_date"),13));
    LinearLayout actions=new LinearLayout(this);String[][] acts={{"Terima","accepted"},{"Tolak","rejected"},{"Mulai","started"},{"Selesai","completed"}};
    for(String[] ac:acts){Button b=btn(ac[0]);actions.addView(b,new LinearLayout.LayoutParams(0,-2,1));final String act=ac[1],id=x.optString("id");b.setOnClickListener(v->bookingAction(id,act));}
    card.addView(actions);content.addView(card);
  }catch(Exception ignored){}}

  private void bookingAction(String id,String action){io.submit(()->{try{
    JSONObject p=new JSONObject().put("p_booking_id",id).put("p_action",action).put("p_note","Mobile Partner Office");
    request("/rest/v1/rpc/partner_booking_action","POST",p.toString(),accessToken);runOnUiThread(this::loadBookings);
  }catch(Exception e){runOnUiThread(()->Toast.makeText(this,"Aksi gagal: "+e.getMessage(),Toast.LENGTH_LONG).show());}});}

  private void loadFleet(){content.removeAllViews();content.addView(tv("Supply Kendaraan Partner",19));io.submit(()->{try{
    JSONArray a=new JSONArray(request("/rest/v1/partner_vehicles?select=id,supply_code,status,active,notes","GET",null,accessToken));runOnUiThread(()->{
      if(a.length()==0){content.addView(tv("Belum ada supply kendaraan.",14));return;}
      for(int i=0;i<a.length();i++){JSONObject x=a.optJSONObject(i);content.addView(tv(x.optString("supply_code")+" • "+x.optString("status")+" • "+(x.optBoolean("active")?"Aktif":"Nonaktif"),15));}
    });
  }catch(Exception e){runOnUiThread(()->content.addView(tv("Gagal memuat supply: "+e.getMessage(),13)));}});}

  private String request(String path,String method,String body,String token)throws Exception{
    HttpURLConnection c=(HttpURLConnection)new URL(SUPABASE_URL+path).openConnection();c.setRequestMethod(method);c.setConnectTimeout(15000);c.setReadTimeout(20000);
    c.setRequestProperty("apikey",SUPABASE_KEY);c.setRequestProperty("Content-Type","application/json");c.setRequestProperty("Accept","application/json");if(token!=null)c.setRequestProperty("Authorization","Bearer "+token);
    if(body!=null){c.setDoOutput(true);try(OutputStream o=c.getOutputStream()){o.write(body.getBytes(StandardCharsets.UTF_8));}}
    int code=c.getResponseCode();InputStream in=code>=200&&code<300?c.getInputStream():c.getErrorStream();StringBuilder s=new StringBuilder();
    try(BufferedReader r=new BufferedReader(new InputStreamReader(in,StandardCharsets.UTF_8))){String line;while((line=r.readLine())!=null)s.append(line);}
    String out=s.toString();if(code<200||code>=300)throw new IOException(code+": "+out);return out;
  }
  @Override protected void onDestroy(){super.onDestroy();io.shutdownNow();}
}
