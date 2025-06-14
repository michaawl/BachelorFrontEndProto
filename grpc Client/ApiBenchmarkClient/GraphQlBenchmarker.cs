using GraphQL;
using GraphQL.Client.Http;
using GraphQL.Client.Serializer.Newtonsoft;
using Newtonsoft.Json.Linq;
using System;
using System.Diagnostics;
using System.Net;


public static class GraphQlBenchmarker
{
    private const string _url = "https://localhost:7046/graphql";
    private static readonly GraphQLHttpClient _client;

    static GraphQlBenchmarker()
    {
        var handler = new SocketsHttpHandler
        {
            EnableMultipleHttp2Connections = true
        };

        // HTTP/2
        var httpClient = new HttpClient(handler)
        {
            DefaultRequestVersion = HttpVersion.Version20,
            DefaultVersionPolicy = HttpVersionPolicy.RequestVersionOrLower
        };

        _client = new GraphQLHttpClient(
            new GraphQLHttpClientOptions { EndPoint = new Uri(_url) },
            new NewtonsoftJsonSerializer(),
            httpClient
        );
    }

    public static async Task RunMenuAsync()
    {
        while (true)
        {
            Console.WriteLine("\n ##### GraphQL Benchmark #####");
            Console.WriteLine("1) Text");
            Console.WriteLine("2) Media");
            Console.WriteLine("3) Blog");
            Console.WriteLine("Type 'exit' to go back");
            Console.Write("Select resource: ");

            var input = Console.ReadLine();
            if (input?.Trim().ToLower() == "exit") 
                return;

            switch (input)
            {
                case "1":
                    await BenchmarkTextAsync();
                    break;
                case "2":
                    await BenchmarkMediaAsync();
                    break;
                case "3":
                    await BenchmarkBlogAsync();
                    break;
                default:
                    Console.WriteLine("Invalid selection.\n");
                    break;
            }
        }
    }

    static async Task BenchmarkTextAsync()
    {
        while (true)
        {
            Console.WriteLine("Text size? 1) Small  2) Medium  3) Large");
            Console.WriteLine("Type exit to go back");
            Console.Write("Select text size: ");
            var sizeInput = Console.ReadLine()?.Trim().ToLower();
            if (sizeInput == "exit")
                return;

            string field = sizeInput 
                switch
            {
                "1" => "small",
                "2" => "medium",
                "3" => "large",
                _ => null
            };

            if (field == null)
            {
                Console.WriteLine("Invalid selection.\n");
                continue;
            }

            var query = new GraphQLRequest
            {
                Query = $"query {{ {field} {{ content }} }}"
            };

            var sw = Stopwatch.StartNew();
            var resp = await _client.SendQueryAsync<dynamic>(query);
            sw.Stop();

            var content = resp.Data?[field]?["content"]?.ToString();

            if (content == null)
            {
                Console.WriteLine("No content returned.\n");
                continue;
            }

            var byteSize = System.Text.Encoding.UTF8.GetByteCount(content);

            Console.WriteLine($"GraphQL {field}: {byteSize} bytes in {sw.ElapsedMilliseconds} ms\n");
        }
    }

    static async Task BenchmarkMediaAsync()
    {
        while (true)
        {
            Console.WriteLine("Media type? 1) Image  2) Audio  3) Video");
            Console.WriteLine("Type exit to go back");
            Console.Write("Select media type: ");
            var key = Console.ReadLine()?.Trim().ToLower();

            if (key == "exit") return;

            string field = key switch
            {
                "1" => "image",
                "2" => "audio",
                "3" => "video",
                _ => null
            };

            if (field == null)
            {
                Console.WriteLine("Invalid selection.\n");
                continue;
            }

            var request = new GraphQLRequest
            {
                Query = $"query {{ {field} }}"
            };

            var sw = Stopwatch.StartNew();
            var resp = await _client.SendQueryAsync<dynamic>(request);
            sw.Stop();

            var raw = resp.Data?[field];
            if (raw == null)
            {
                Console.WriteLine($"No data returned for {field}.\n");
                continue;
            }

            long byteSize = 0;
            if (raw.Type == JTokenType.String)
            {
                try
                {
                    byteSize = Convert.FromBase64String((string)raw).LongLength;
                }
                catch
                {
                    byteSize = ((string)raw).Length;
                }
            }
            else if (raw.Type == JTokenType.Array)
            {
                byteSize = ((JArray)raw).Count;
            }
            else
            {
                byteSize = raw.ToString().Length;
            }

            Console.WriteLine($"GraphQL {field}: {byteSize} bytes in {sw.ElapsedMilliseconds} ms\n");
        }
    }

    static async Task BenchmarkBlogAsync()
    {
        while (true)
        {
            Console.WriteLine("Blog? yes or exit");

            var choice = Console.ReadLine()?.Trim().ToLower();
            if (choice == "exit") 
                return;

            string queryStr;


                queryStr = @"
query {
  posts {
    id
    title
    author { name email }
    sections { heading body }
    numbers { numberOne numberTwo numberThree numberFour }
    metadata { tags wordCount }
    publishedAt
  }
}";

            var req = new GraphQLRequest { Query = queryStr };
            var sw = Stopwatch.StartNew();
            var res = await _client.SendQueryAsync<dynamic>(req);
            sw.Stop();

            var postsToken = res.Data?["posts"];
            if (postsToken == null)
            {
                Console.WriteLine("No posts returned.\n");
                continue;
            }

            string jsonText = postsToken.ToString(Newtonsoft.Json.Formatting.None);

            int byteSize = System.Text.Encoding.UTF8.GetByteCount(jsonText);

            Console.WriteLine($"REST /api/blog - {byteSize} bytes ({sw.ElapsedMilliseconds} ms)\n");
        }
    }
}
