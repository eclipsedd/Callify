#pragma GCC optimize("Ofast")
#pragma GCC optimize("unroll-loops")
#include <bits/stdc++.h>
#include <unordered_set>

using namespace std;

using ll = long long;
using ld = long double;
using vl = vector<ll>;

#define vecp(v) vector<pair<ll, ll>> v;
#define forr(i, a, b) for (i = a; i <= b; i++)
#define f(i, n) for (i = 0; i < n; i++)
#define pb push_back
#define mp make_pair
#define forvp(v) for (const auto &vp : v)
#define forv(v) for (auto &vc : v)
#define all(v) v.begin(), v.end()
#define getv(v, n) \
    vl v(n);       \
    f(i, n) cin >> v[i]
#define no cout << "No" << "\n"
#define yes cout << "Yes" << "\n"

#define inf 9223372036854775807

const ll MOD = 1e9 + 7;
const ll MOD2 = 998244353;

void solve()
{
    ll n, m, k = 0, j = 0, i = 0, x = 0, y = 0, p = 0, q = 1, ans = 0, flag = 0, count = 0;
    cin >> n>>k;
    vector<ll> a(n);
    for (i = 0; i < n; i++)
    {
        cin >> a[i];
    }
    sort(all(a));
    p=a[1]-a[0];
    for (i = 2; i < n; i++)
    {
        p=__gcd(a[i]-a[i-1],p);   
    }
    if(((abs(k-a[0]))%p)==0)cout<<"YES";else cout<<"NO";
}

int main()
{
    // freopen("input.txt", "r", stdin);
    // freopen("output.txt", "w", stdout);
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cout.tie(NULL);
    ll t = 1;
    cin >> t;
    while (t--)
    {
        solve();
        cout << endl;
    }
}