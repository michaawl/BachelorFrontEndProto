using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

public static class RestBenchmarker
{
    private static readonly HttpClient _client;

    static RestBenchmarker()
    {
        var handler = new SocketsHttpHandler
        {
            EnableMultipleHttp2Connections = true
        };

        _client = new HttpClient(handler)
        {
            // request HTTP/2
            DefaultRequestVersion = HttpVersion.Version20,
            DefaultVersionPolicy = HttpVersionPolicy.RequestVersionOrLower
        };
    }

    public static async Task RunMenuAsync()
    {
        while (true)
        {
            Console.WriteLine("\n##### REST Benchmark ####");
            Console.WriteLine("1) Text");
            Console.WriteLine("2) Media");
            Console.WriteLine("3) Blog");
            Console.WriteLine("exit");
            Console.Write("Select resource: ");

            var input = Console.ReadLine();

            if (input?.Trim().ToLower() == "Type exit to go back") 
                return;

            if (input == "exit")
                return;

            switch (input)
            {
                case "1": await BenchmarkTextAsync(); 
                    break;
                case "2": await BenchmarkMediaAsync(); 
                    break;
                case "3": await BenchmarkBlogAsync();
                    break;
                default: Console.WriteLine("Invalid selection.\n"); 
                    break;
            }
        }
    }

    static async Task BenchmarkTextAsync()
    {
        while (true)
        {
            Console.WriteLine("1) Small  2) Medium  3) Large");
            Console.WriteLine("Type exit to go back");
            Console.Write("Select text size: ");

            var sizeInput = Console.ReadLine();

            if (sizeInput?.Trim().ToLower() == "exit") 
                return;

            string path = sizeInput switch
            {
                "1" => "small",
                "2" => "medium",
                "3" => "large",
                _ => null
            };

            if (path == null)
            {
                Console.WriteLine("Invalid selection.\n");
                continue;
            }

            var url = $"https://localhost:7001/text/{path}";
            var watch = System.Diagnostics.Stopwatch.StartNew();
            var response = await _client.GetStringAsync(url);
            watch.Stop();

            var byteSize = System.Text.Encoding.UTF8.GetByteCount(response);
            Console.WriteLine($"REST /text/{path} - {byteSize} bytes ({watch.ElapsedMilliseconds} ms)\n");
        }
    }

    static async Task BenchmarkMediaAsync()
    {
        while (true)
        {
            Console.WriteLine("Media type? 1) Image  2) Audio  3) Video");
            Console.WriteLine("Type 'exit' to go back");
            Console.Write("Select media type: ");

            var mediaInput = Console.ReadLine();
            if (mediaInput?.Trim().ToLower() == "exit")
                return;

            string path = mediaInput switch
            {
                "1" => "image",
                "2" => "audio",
                "3" => "video",
                _ => null
            };

            if (path == null)
            {
                Console.WriteLine("Invalid selection.\n");
                continue;
            }

            var url = $"https://localhost:7001/media/{path}";
            var watch = System.Diagnostics.Stopwatch.StartNew();
            var response = await _client.GetAsync(url);
            var bytes = await response.Content.ReadAsByteArrayAsync();

            watch.Stop();

            Console.WriteLine($"REST /media/{path} - {bytes.Length} bytes ({watch.ElapsedMilliseconds} ms)\n");
        }
    }

    static async Task BenchmarkBlogAsync()
    {
        while (true)
        {
            Console.WriteLine("Blog? Type yes or exit");

            var blogInput = Console.ReadLine();

            if (blogInput?.Trim().ToLower() == "exit") 
                return;

            string url = "https://localhost:7001/api/blog";

            if (blogInput != "yes")
            {
                Console.WriteLine("Invalid selection.\n");
                continue;
            }

            var watch = System.Diagnostics.Stopwatch.StartNew();
            var response = await _client.GetStringAsync(url);
            watch.Stop();

            var byteSize = System.Text.Encoding.UTF8.GetByteCount(response);
            Console.WriteLine($"REST /api/blog - {byteSize} bytes ({watch.ElapsedMilliseconds} ms)\n");
        }
    }
}
